// Models/Listing.cs

namespace ThriftoServer.Models
{
    public class Listing
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Measurement { get; set; }
        public string Quality { get; set; }
        public decimal Price { get; set; }
        public string Description { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;

        // Foreign keys
        public string UserId { get; set; }

        // Navigation properties
        public User User { get; set; }
        public ICollection<ListingPhoto> Photos { get; set; }
    }
}