// DTOs/MessageCreateDto.cs
using System.ComponentModel.DataAnnotations;

namespace ThriftoServer.DTOs
{
    public class MessageCreateDto
    {
        [Required]
        public string ReceiverId { get; set; }

        [Required]
        [StringLength(1000)]
        public string Content { get; set; }
    }
}