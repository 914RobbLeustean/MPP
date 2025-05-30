// DTOs/ListingDto.cs
namespace ThriftoServer.DTOs
{
    public class ListingDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Measurement { get; set; }
        public string Quality { get; set; }
        public decimal Price { get; set; }
        public string Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public string UserId { get; set; }
        public string UserName { get; set; }
        public string MainPhotoUrl { get; set; }
        public List<string> PhotoUrls { get; set; }
    }
}