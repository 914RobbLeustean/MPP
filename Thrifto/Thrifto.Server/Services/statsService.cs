using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ThriftoServer.Data;
using ThriftoServer.DTOs;

namespace ThriftoServer.Services
{
    public class StatsService
    {
        private readonly AppDbContext _context;
        private readonly IMemoryCache _cache;
        private readonly ILogger<StatsService> _logger;

        public StatsService(AppDbContext context, IMemoryCache cache, ILogger<StatsService> logger)
        {
            _context = context;
            _cache = cache;
            _logger = logger;
        }

        public async Task<MarketplaceStatsDto> GetMarketplaceStatisticsAsync()
        {
            // Try to get from cache first
            string cacheKey = "MarketplaceStats";
            if (_cache.TryGetValue(cacheKey, out MarketplaceStatsDto cachedStats))
            {
                return cachedStats;
            }

            _logger.LogInformation("Generating marketplace statistics");

            var stopwatch = System.Diagnostics.Stopwatch.StartNew();

            // Execute queries sequentially to avoid DbContext threading issues
            var activeListings = await _context.Listings.Where(l => l.IsActive).CountAsync();
            var totalUsers = await _context.Users.Where(u => u.IsActive).CountAsync();

            var qualityStats = await _context.Listings
                .Where(l => l.IsActive)
                .GroupBy(l => l.Quality)
                .Select(g => new QualityStatDto
                {
                    Quality = g.Key,
                    Count = g.Count(),
                    AvgPrice = g.Average(l => l.Price),
                    MinPrice = g.Min(l => l.Price),
                    MaxPrice = g.Max(l => l.Price)
                })
                .ToListAsync();

            var topSellers = await _context.Users
                .Where(u => u.IsActive)
                .Select(u => new
                {
                    UserId = u.Id,
                    Username = u.UserName,
                    ListingCount = u.Listings.Count(l => l.IsActive),
                    AverageRating = u.ReceivedFeedbacks.Any()
                        ? u.ReceivedFeedbacks.Average(f => f.Rating)
                        : 0
                })
                .Where(s => s.ListingCount > 0)
                .OrderByDescending(s => s.ListingCount)
                .Take(10)
                .Select(s => new TopSellerDto
                {
                    UserId = s.UserId,
                    Username = s.Username,
                    ActiveListings = s.ListingCount,
                    AverageRating = Math.Round(s.AverageRating, 1)
                })
                .ToListAsync();

            var priceTrends = await _context.Listings
                .Where(l => l.CreatedAt >= DateTime.UtcNow.AddMonths(-6))
                .GroupBy(l => new
                {
                    Year = l.CreatedAt.Year,
                    Month = l.CreatedAt.Month
                })
                .Select(g => new PriceTrendDto
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    AveragePrice = Math.Round((decimal)g.Average(l => l.Price), 2),
                    ListingCount = g.Count()
                })
                .OrderBy(t => t.Year)
                .ThenBy(t => t.Month)
                .ToListAsync();

            // Compile results
            var result = new MarketplaceStatsDto
            {
                TotalActiveListings = activeListings,
                TotalActiveUsers = totalUsers,
                QualityStats = qualityStats,
                TopSellers = topSellers,
                PriceTrends = priceTrends
            };

            stopwatch.Stop();
            _logger.LogInformation($"Generated marketplace statistics in {stopwatch.ElapsedMilliseconds}ms");

            // Cache the result for 15 minutes
            _cache.Set(cacheKey, result, TimeSpan.FromMinutes(15));

            return result;
        }

        public async Task<UserStatsDto> GetUserStatisticsAsync(string userId)
        {
            // Cache key including user ID
            string cacheKey = $"UserStats_{userId}";
            if (_cache.TryGetValue(cacheKey, out UserStatsDto cachedStats))
            {
                return cachedStats;
            }

            var stopwatch = System.Diagnostics.Stopwatch.StartNew();

            // Get active listings
            var activeListings = await _context.Listings
                .Where(l => l.UserId == userId && l.IsActive)
                .ToListAsync();

            // Get inactive listings
            var inactiveListings = await _context.Listings
                .Where(l => l.UserId == userId && !l.IsActive)
                .ToListAsync();

            // Calculate totals
            var activeCount = activeListings.Count;
            var inactiveCount = inactiveListings.Count;
            var totalValue = activeListings.Sum(l => l.Price) + inactiveListings.Sum(l => l.Price);

            // Get feedbacks
            var feedbacks = await _context.Feedbacks
                .Where(f => f.UserId == userId)
                .ToListAsync();

            // Calculate feedback stats
            var feedbackCounts = new int[6]; // 0-5 ratings
            foreach (var feedback in feedbacks)
            {
                feedbackCounts[feedback.Rating]++;
            }

            var totalFeedbacks = feedbacks.Count;
            var totalRatingSum = feedbacks.Sum(f => f.Rating);
            var averageRating = totalFeedbacks > 0 ? (double)totalRatingSum / totalFeedbacks : 0;

            // Get activity history
            var activityHistory = await _context.Listings
                .Where(l => l.UserId == userId && l.CreatedAt >= DateTime.UtcNow.AddMonths(-6))
                .GroupBy(l => new
                {
                    Year = l.CreatedAt.Year,
                    Month = l.CreatedAt.Month
                })
                .Select(g => new UserActivityDto
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    NewListings = g.Count()
                })
                .OrderBy(a => a.Year)
                .ThenBy(a => a.Month)
                .ToListAsync();

            var result = new UserStatsDto
            {
                UserId = userId,
                ActiveListings = activeCount,
                InactiveListings = inactiveCount,
                TotalListingValue = totalValue,
                AverageRating = Math.Round(averageRating, 1),
                FeedbackCounts = feedbackCounts,
                ActivityHistory = activityHistory
            };

            stopwatch.Stop();
            _logger.LogInformation($"Generated user statistics in {stopwatch.ElapsedMilliseconds}ms");

            // Cache for 15 minutes
            _cache.Set(cacheKey, result, TimeSpan.FromMinutes(15));

            return result;
        }
    }
}   