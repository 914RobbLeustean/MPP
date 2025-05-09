// DTOs/FeedbackDto.cs
namespace ThriftoServer.DTOs
{
    public class FeedbackDto
    {
        public int Id { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; }
        public DateTime CreatedAt { get; set; }
        public string ReviewerId { get; set; }
        public string ReviewerUsername { get; set; }
        public string UserId { get; set; }
    }
}