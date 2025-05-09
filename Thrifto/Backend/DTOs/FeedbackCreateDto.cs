// DTOs/FeedbackCreateDto.cs
using System.ComponentModel.DataAnnotations;

namespace ThriftoServer.DTOs
{
    public class FeedbackCreateDto
    {
        [Required]
        public string UserId { get; set; }

        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        [StringLength(500)]
        public string Comment { get; set; }
    }
}