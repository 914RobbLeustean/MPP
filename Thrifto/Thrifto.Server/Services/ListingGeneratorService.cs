// Services/ListingGeneratorService.cs
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ThriftoServer.Data;
using ThriftoServer.DTOs;
using ThriftoServer.Hubs;
using ThriftoServer.Models;

namespace ThriftoServer.Services
{
    public class ListingGeneratorService : BackgroundService
    {
        private readonly ILogger<ListingGeneratorService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly Random _random = new Random();
        private readonly string[] _adminUserIds;
        private readonly TimeSpan _interval = TimeSpan.FromSeconds(60); // Generate a new listing every minute

        // Sample data for random listings
        private readonly string[] _titles = {
            "Vintage Denim Jacket", "Silk Blouse", "Wool Sweater", "Leather Skirt",
            "Cashmere Scarf", "Cotton T-Shirt", "Linen Pants", "Designer Jeans",
            "Summer Dress", "Winter Coat", "Formal Suit", "Casual Shirt",
            "Evening Gown", "Athletic Wear", "Swimwear Set", "Accessories Bundle"
        };

        private readonly string[] _measurements = { "S", "M", "L", "XL", "XXL", "36", "38", "40", "42", "44" };

        private readonly string[] _qualities = { "NEW", "LIKE NEW", "BARELY WORN", "USED" };

        private readonly string[] _descriptions = {
            "In excellent condition, barely worn.",
            "Classic style that never goes out of fashion.",
            "Perfect for both casual and formal occasions.",
            "Minor wear but still looks great.",
            "Unique piece that will stand out in your wardrobe.",
            "Comfortable and stylish for everyday wear.",
            "High-quality material that will last.",
            "Great value for a designer item.",
            "Versatile addition to any wardrobe.",
            "Seasonal must-have at a fraction of the retail price."
        };

        public ListingGeneratorService(
            ILogger<ListingGeneratorService> logger,
            IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;

            // We'll need at least one admin user ID to assign to generated listings
            // This would normally come from configuration or the database
            _adminUserIds = new[] { "system-generator" };
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Listing Generator Service is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogInformation("Generating new listing at: {time}", DateTimeOffset.Now);

                try
                {
                    // Generate and save a new listing
                    await GenerateRandomListing();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error generating listing");
                }

                // Wait for the next interval
                await Task.Delay(_interval, stoppingToken);
            }

            _logger.LogInformation("Listing Generator Service is stopping.");
        }

        private async Task GenerateRandomListing()
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<ListingHub>>();

                // Ensure we have valid user IDs to work with
                string userId = await GetRandomUserId(dbContext);
                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("No valid user IDs found. Using admin ID.");
                    userId = _adminUserIds[0];
                }

                // Create a new listing with random data
                var listing = new Listing
                {
                    Title = _titles[_random.Next(_titles.Length)],
                    Measurement = _measurements[_random.Next(_measurements.Length)],
                    Quality = _qualities[_random.Next(_qualities.Length)],
                    Price = _random.Next(10, 500),
                    Description = _descriptions[_random.Next(_descriptions.Length)],
                    CreatedAt = DateTime.UtcNow,
                    UserId = userId,
                    IsActive = true
                };

                
                dbContext.Listings.Add(listing);
                await dbContext.SaveChangesAsync();
                                            
                var photoUrl = $"/assets/images/generated/item{_random.Next(1, 6)}.jpg";

                var photo = new ListingPhoto
                {
                    ListingId = listing.Id,
                    Url = photoUrl,
                    IsMain = true,
                    PublicId = Guid.NewGuid().ToString()
                };

                dbContext.ListingPhotos.Add(photo);
                await dbContext.SaveChangesAsync();

                // Get user info for the DTO
                var user = await dbContext.Users.FindAsync(userId);

                // Create DTO to send to clients
                var listingDto = new ListingDto
                {
                    Id = listing.Id,
                    Title = listing.Title,
                    Measurement = listing.Measurement,
                    Quality = listing.Quality,
                    Price = listing.Price,
                    Description = listing.Description,
                    CreatedAt = listing.CreatedAt,
                    UserId = listing.UserId,
                    UserName = user?.UserName ?? "Generated User",
                    MainPhotoUrl = photoUrl,
                    PhotoUrls = new List<string> { photoUrl }
                };

                // Notify clients about the new listing
                await hubContext.Clients.All.SendAsync("ReceiveNewListing", listingDto);

                // Send chart update data
                await SendChartUpdateData(dbContext, hubContext);

                _logger.LogInformation("Generated new listing: {id} - {title}", listing.Id, listing.Title);
            }
        }

        private async Task<string> GetRandomUserId(AppDbContext dbContext)
        {
            // Get a random user ID from the database to make the data realistic
            var userIds = await Task.FromResult(dbContext.Users.Select(u => u.Id).ToList());

            if (userIds.Any())
            {
                return userIds[_random.Next(userIds.Count)];
            }

            return null;
        }

        private async Task SendChartUpdateData(AppDbContext dbContext, IHubContext<ListingHub> hubContext)
        {
            // Get all active listings
            var listings = await Task.FromResult(
                dbContext.Listings
                    .Where(l => l.IsActive)
                    .ToList()
            );

            if (!listings.Any())
            {
                return;
            }

            // Calculate price buckets
            var priceBuckets = new Dictionary<string, int>
            {
                { "0-50", 0 },
                { "50-100", 0 },
                { "100-200", 0 },
                { "200-500", 0 },
                { "500+", 0 }
            };

            foreach (var listing in listings)
            {
                if (listing.Price <= 50) priceBuckets["0-50"]++;
                else if (listing.Price <= 100) priceBuckets["50-100"]++;
                else if (listing.Price <= 200) priceBuckets["100-200"]++;
                else if (listing.Price <= 500) priceBuckets["200-500"]++;
                else priceBuckets["500+"]++;
            }

            // Calculate quality distribution
            var qualityCounts = listings
                .GroupBy(l => l.Quality)
                .ToDictionary(
                    g => g.Key,
                    g => g.Count()
                );

            // Calculate listings per day
            var dateListings = listings
                .GroupBy(l => l.CreatedAt.Date)
                .OrderBy(g => g.Key)
                .ToDictionary(
                    g => g.Key.ToString("MM/dd/yyyy"),
                    g => g.Count()
                );

            // Calculate statistics
            var totalListings = listings.Count;
            var averagePrice = listings.Average(l => l.Price);
            var highestPrice = listings.Max(l => l.Price);

            // Create chart data object
            var chartData = new ChartDataDto
            {
                PriceData = new
                {
                    labels = priceBuckets.Keys.ToList(),
                    datasets = new[]
                    {
                        new
                        {
                            label = "Number of Listings",
                            data = priceBuckets.Values.ToList(),
                            backgroundColor = new[]
                            {
                                "rgba(255, 99, 132, 0.2)",
                                "rgba(54, 162, 235, 0.2)",
                                "rgba(255, 206, 86, 0.2)",
                                "rgba(75, 192, 192, 0.2)",
                                "rgba(153, 102, 255, 0.2)"
                            },
                            borderColor = new[]
                            {
                                "rgba(255, 99, 132, 1)",
                                "rgba(54, 162, 235, 1)",
                                "rgba(255, 206, 86, 1)",
                                "rgba(75, 192, 192, 1)",
                                "rgba(153, 102, 255, 1)"
                            },
                            borderWidth = 1
                        }
                    }
                },
                QualityData = new
                {
                    labels = qualityCounts.Keys.ToList(),
                    datasets = new[]
                    {
                        new
                        {
                            label = "Number of Listings",
                            data = qualityCounts.Values.ToList(),
                            backgroundColor = new[]
                            {
                                "rgba(255, 99, 132, 0.2)",
                                "rgba(54, 162, 235, 0.2)",
                                "rgba(255, 206, 86, 0.2)",
                                "rgba(75, 192, 192, 0.2)"
                            },
                            borderColor = new[]
                            {
                                "rgba(255, 99, 132, 1)",
                                "rgba(54, 162, 235, 1)",
                                "rgba(255, 206, 86, 1)",
                                "rgba(75, 192, 192, 1)"
                            },
                            borderWidth = 1
                        }
                    }
                },
                TimeData = new
                {
                    labels = dateListings.Keys.ToList(),
                    datasets = new[]
                    {
                        new
                        {
                            label = "New Listings",
                            data = dateListings.Values.ToList(),
                            backgroundColor = "rgba(168, 57, 57, 0.2)",
                            borderColor = "rgba(168, 57, 57, 1)",
                            borderWidth = 1,
                            tension = 0.1
                        }
                    }
                },
                TotalListings = totalListings,
                AveragePrice = averagePrice,
                HighestPrice = highestPrice
            };

            // Send the chart data to all clients
            await hubContext.Clients.All.SendAsync("ReceiveChartUpdate", chartData);
        }
    }
}