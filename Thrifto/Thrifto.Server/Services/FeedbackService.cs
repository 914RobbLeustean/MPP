// Services/FeedbackService.cs
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ThriftoServer.Data;
using ThriftoServer.DTOs;
using ThriftoServer.Models;

namespace ThriftoServer.Services
{
    public class FeedbackService
    {
        private readonly AppDbContext _context;

        public FeedbackService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<FeedbackDto>> GetUserFeedbackAsync(string userId)
        {
            var feedback = await _context.Feedbacks
                .Include(f => f.Reviewer)
                .Where(f => f.UserId == userId)
                .OrderByDescending(f => f.CreatedAt)
                .Select(f => new FeedbackDto
                {
                    Id = f.Id,
                    Rating = f.Rating,
                    Comment = f.Comment,
                    CreatedAt = f.CreatedAt,
                    ReviewerId = f.ReviewerId,
                    ReviewerUsername = f.Reviewer.UserName,
                    UserId = f.UserId
                })
                .ToListAsync();

            return feedback;
        }

        public async Task<FeedbackDto> CreateFeedbackAsync(string reviewerId, FeedbackCreateDto feedbackDto)
        {
            var feedback = new Feedback
            {
                Rating = feedbackDto.Rating,
                Comment = feedbackDto.Comment,
                CreatedAt = DateTime.UtcNow,
                ReviewerId = reviewerId,
                UserId = feedbackDto.UserId
            };

            _context.Feedbacks.Add(feedback);
            await _context.SaveChangesAsync();

            var reviewer = await _context.Users.FindAsync(reviewerId);

            return new FeedbackDto
            {
                Id = feedback.Id,
                Rating = feedback.Rating,
                Comment = feedback.Comment,
                CreatedAt = feedback.CreatedAt,
                ReviewerId = feedback.ReviewerId,
                ReviewerUsername = reviewer?.UserName,
                UserId = feedback.UserId
            };
        }

        public async Task<double> GetAverageRatingAsync(string userId)
        {
            var feedbacks = await _context.Feedbacks
                .Where(f => f.UserId == userId)
                .ToListAsync();

            if (!feedbacks.Any())
                return 0;

            return Math.Round(feedbacks.Average(f => f.Rating), 1);
        }
    }
}