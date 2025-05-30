// DTOs/MessageDto.cs
namespace ThriftoServer.DTOs
{
    public class MessageDto
    {
        public int Id { get; set; }
        public string SenderId { get; set; }
        public string Content { get; set; }
        public DateTime Timestamp { get; set; }
        public bool IsFromCurrentUser { get; set; }
    }
}