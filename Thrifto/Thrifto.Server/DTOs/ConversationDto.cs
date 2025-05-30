// DTOs/ConversationDto.cs
namespace ThriftoServer.DTOs
{
    public class ConversationDto
    {
        public string UserId { get; set; }
        public string Username { get; set; }
        public string LastMessage { get; set; }
        public DateTime LastMessageTimestamp { get; set; }
        public int UnreadCount { get; set; }
    }
}