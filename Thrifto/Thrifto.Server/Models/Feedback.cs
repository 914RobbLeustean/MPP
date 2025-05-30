// Models/Feedback.cs
namespace ThriftoServer.Models
{
    public class Feedback
    {
        public int Id { get; set; }
        public int Rating { get; set; } // 1-5 stars
        public string Comment { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Foreign keys
        public string ReviewerId { get; set; }
        public string UserId { get; set; }

        // Navigation properties
        public User Reviewer { get; set; }
        public User User { get; set; }
    }
}