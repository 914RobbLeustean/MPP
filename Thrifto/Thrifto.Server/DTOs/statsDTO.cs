// DTOs/StatsDto.cs
namespace ThriftoServer.DTOs
{
    public class MarketplaceStatsDto
    {
        public int TotalActiveListings { get; set; }
        public int TotalActiveUsers { get; set; }
        public List<QualityStatDto> QualityStats { get; set; }
        public List<TopSellerDto> TopSellers { get; set; }
        public List<PriceTrendDto> PriceTrends { get; set; }
    }

    public class QualityStatDto
    {
        public string Quality { get; set; }
        public int Count { get; set; }
        public decimal AvgPrice { get; set; }
        public decimal MinPrice { get; set; }
        public decimal MaxPrice { get; set; }
    }

    public class TopSellerDto
    {
        public string UserId { get; set; }
        public string Username { get; set; }
        public int ActiveListings { get; set; }
        public double AverageRating { get; set; }
    }

    public class PriceTrendDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public decimal AveragePrice { get; set; }
        public int ListingCount { get; set; }
    }

    public class UserStatsDto
    {
        public string UserId { get; set; }
        public int ActiveListings { get; set; }
        public int InactiveListings { get; set; }
        public decimal TotalListingValue { get; set; }
        public double AverageRating { get; set; }
        public int[] FeedbackCounts { get; set; } // 0-5 ratings
        public List<UserActivityDto> ActivityHistory { get; set; }
    }

    public class UserActivityDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public int NewListings { get; set; }
    }
}