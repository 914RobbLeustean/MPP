// Models/ChatMessage.cs
namespace ThriftoServer.Models
{
    public class ChatMessage
    {
        public int Id { get; set; }
        public string Content { get; set; }
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; }

        // Foreign keys
        public string SenderId { get; set; }
        public string ReceiverId { get; set; }

        // Navigation properties
        public User Sender { get; set; }
        public User Receiver { get; set; }
    }
}