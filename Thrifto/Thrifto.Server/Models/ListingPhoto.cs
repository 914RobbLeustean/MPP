// Models/ListingPhoto.cs
namespace ThriftoServer.Models
{
    public class ListingPhoto
    {
        public int Id { get; set; }
        public string Url { get; set; }
        public bool IsMain { get; set; }
        public string PublicId { get; set; }

        // Foreign keys
        public int ListingId { get; set; }

        // Navigation properties
        public Listing Listing { get; set; }
    }
}