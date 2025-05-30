// Services/DataSeeder.cs
using Bogus;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ThriftoServer.Data;
using ThriftoServer.Models;

namespace ThriftoServer.Services
{
    public class DataSeeder
    {
        private readonly AppDbContext _context;
        private readonly UserManager<User> _userManager;
        private readonly ILogger<DataSeeder> _logger;

        public DataSeeder(AppDbContext context, UserManager<User> userManager, ILogger<DataSeeder> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        public async Task SeedDataAsync(int userCount = 1000, int listingsPerUser = 100)
        {
            _logger.LogInformation("Starting database seeding...");

            // Check if database is already seeded
            if (await _context.Users.CountAsync() > 100)
            {
                _logger.LogInformation("Database already has data, skipping seed.");
                return;
            }

            var users = await SeedUsersAsync(userCount);
            await SeedListingsAsync(users, listingsPerUser);
            await SeedFeedbackAsync(users);
            await SeedChatMessagesAsync(users);

            _logger.LogInformation("Database seeding completed successfully.");
        }

        private async Task<List<User>> SeedUsersAsync(int count)
        {
            _logger.LogInformation($"Seeding {count} users...");

            // Create a deterministic faker for users
            var userFaker = new Faker<User>()
                .RuleFor(u => u.UserName, f => f.Internet.UserName())
                .RuleFor(u => u.Email, (f, u) => f.Internet.Email(u.UserName))
                .RuleFor(u => u.FirstName, f => f.Name.FirstName())
                .RuleFor(u => u.LastName, f => f.Name.LastName())
                .RuleFor(u => u.PhoneNumber, f => f.Phone.PhoneNumber())
                .RuleFor(u => u.Created, f => f.Date.Past(2))
                .RuleFor(u => u.IsActive, f => f.Random.Bool(0.9f)); // 90% active

            var users = userFaker.Generate(count);

            // Batch users into chunks to prevent memory issues
            int batchSize = 100;
            for (int i = 0; i < users.Count; i += batchSize)
            {
                var batch = users.Skip(i).Take(batchSize);
                foreach (var user in batch)
                {
                    user.EmailConfirmed = true;
                    user.NormalizedEmail = user.Email.ToUpper();
                    user.NormalizedUserName = user.UserName.ToUpper();

                    // Create with a consistent password for testing
                    await _userManager.CreateAsync(user, "Password123!");
                }
                _logger.LogInformation($"Added users batch {i / batchSize + 1} of {(users.Count / batchSize) + 1}");
            }

            return users;
        }

        private async Task SeedListingsAsync(List<User> users, int listingsPerUser)
        {
            _logger.LogInformation($"Seeding {users.Count * listingsPerUser} listings...");

            var qualityOptions = new[] { "New", "Like New", "Good", "Fair", "Poor" };
            var clothingCategories = new[] { "Shirts", "Pants", "Dresses", "Jackets", "Shoes", "Accessories" };
            var sizeOptions = new[] { "XS", "S", "M", "L", "XL", "XXL", "XXXL", "32", "34", "36", "38", "40", "42" };

            var listingFaker = new Faker<Listing>()
                .RuleFor(l => l.Title, f => f.Commerce.ProductName())
                .RuleFor(l => l.Measurement, f => $"{f.PickRandom(sizeOptions)} - {f.Random.Int(1, 4)} years old")
                .RuleFor(l => l.Quality, f => f.PickRandom(qualityOptions))
                .RuleFor(l => l.Price, f => f.Random.Decimal(5, 200))
                .RuleFor(l => l.Description, f => f.Commerce.ProductDescription())
                .RuleFor(l => l.CreatedAt, f => f.Date.Between(DateTime.UtcNow.AddYears(-1), DateTime.UtcNow))
                .RuleFor(l => l.IsActive, f => f.Random.Bool(0.8f)); // 80% active

            var photoFaker = new Faker<ListingPhoto>()
                .RuleFor(p => p.Url, f => f.Image.PicsumUrl())
                .RuleFor(p => p.PublicId, f => Guid.NewGuid().ToString())
                .RuleFor(p => p.IsMain, f => false);

            var photos = photoFaker.Generate(new Faker().Random.Int(1, 5));
            if (photos.Any())
            {
                photos[0].IsMain = true;
            }

            const int batchSize = 1000;
            int totalListings = 0;

            foreach (var user in users)
            {
                var userListings = new List<Listing>();
                for (int i = 0; i < listingsPerUser; i++)
                {
                    var listing = listingFaker.Generate();
                    listing.UserId = user.Id;

                    // Generate 1-5 photos per listing
                    listing.Photos = photoFaker.Generate(new Faker().Random.Int(1, 5))
                        .Select((p, idx) => { p.IsMain = idx == 0; return p; })
                        .ToList();

                    userListings.Add(listing);
                }

                _context.Listings.AddRange(userListings);
                totalListings += userListings.Count;

                if (totalListings >= batchSize)
                {
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Added {totalListings} listings");
                    totalListings = 0;
                }
            }

            if (totalListings > 0)
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Added final batch of {totalListings} listings");
            }
        }

        private async Task SeedFeedbackAsync(List<User> users)
        {
            _logger.LogInformation("Seeding feedback data...");

            var feedbackFaker = new Faker<Feedback>()
                .RuleFor(f => f.Rating, f => f.Random.Int(1, 5))
                .RuleFor(f => f.Comment, f => f.Random.Int(1, 10) > 2 ? f.Lorem.Paragraph(1) : null) // 80% have comments
                .RuleFor(f => f.CreatedAt, f => f.Date.Recent(90));

            var feedbacks = new List<Feedback>();
            var random = new Random();

            // Each user gives feedback to ~20 random other users
            foreach (var reviewer in users)
            {
                var feedbackCount = random.Next(10, 30); // Random number between 10-30 feedbacks
                var usersThatGetFeedback = users
                    .Where(u => u.Id != reviewer.Id) // Can't give feedback to self
                    .OrderBy(_ => Guid.NewGuid()) // Random order
                    .Take(feedbackCount);

                foreach (var receivingUser in usersThatGetFeedback)
                {
                    var feedback = feedbackFaker.Generate();
                    feedback.ReviewerId = reviewer.Id;
                    feedback.UserId = receivingUser.Id;
                    feedbacks.Add(feedback);

                    if (feedbacks.Count >= 5000)
                    {
                        _context.Feedbacks.AddRange(feedbacks);
                        await _context.SaveChangesAsync();
                        _logger.LogInformation($"Added {feedbacks.Count} feedbacks");
                        feedbacks.Clear();
                    }
                }
            }

            if (feedbacks.Any())
            {
                _context.Feedbacks.AddRange(feedbacks);
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Added final batch of {feedbacks.Count} feedbacks");
            }
        }

        private async Task SeedChatMessagesAsync(List<User> users)
        {
            _logger.LogInformation("Seeding chat messages...");

            var messageFaker = new Faker<ChatMessage>()
                .RuleFor(m => m.Content, f => f.Lorem.Sentence())
                .RuleFor(m => m.SentAt, f => f.Date.Recent(30))
                .RuleFor(m => m.IsRead, f => f.Random.Bool(0.7f)); // 70% are read

            var messages = new List<ChatMessage>();
            var random = new Random();

            // Create conversations between random pairs of users
            var conversationPairs = new HashSet<string>(); // To track unique conversations

            // Generate ~50,000 messages across different conversations
            for (int i = 0; i < 50000; i++)
            {
                if (i % 5000 == 0)
                {
                    _logger.LogInformation($"Generated {i} chat messages");
                }

                // Randomly select two distinct users
                var sender = users[random.Next(users.Count)];
                var receiver = users[random.Next(users.Count)];
                while (receiver.Id == sender.Id) // Ensure they're different users
                {
                    receiver = users[random.Next(users.Count)];
                }

                // Create a unique key for this conversation pair (sorted to ensure uniqueness regardless of order)
                var conversationKey = string.Join("-", new[] { sender.Id, receiver.Id }.OrderBy(id => id));
                conversationPairs.Add(conversationKey);

                // Generate 5-20 messages for this conversation
                int messageCount = random.Next(5, 20);
                for (int j = 0; j < messageCount; j++)
                {
                    // Alternate sender and receiver for realistic conversation
                    var actualSender = j % 2 == 0 ? sender : receiver;
                    var actualReceiver = j % 2 == 0 ? receiver : sender;

                    var message = messageFaker.Generate();
                    message.SenderId = actualSender.Id;
                    message.ReceiverId = actualReceiver.Id;

                    messages.Add(message);

                    if (messages.Count >= 10000)
                    {
                        _context.ChatMessages.AddRange(messages);
                        await _context.SaveChangesAsync();
                        _logger.LogInformation($"Added {messages.Count} chat messages");
                        messages.Clear();
                    }
                }
            }

            if (messages.Any())
            {
                _context.ChatMessages.AddRange(messages);
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Added final batch of {messages.Count} chat messages");
            }
        }
    }
}