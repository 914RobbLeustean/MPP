// DTOs/ListingCreateDto.cs
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace ThriftoServer.DTOs
{
    public class ListingCreateDto
    {
        [Required]
        public string Title { get; set; }

        [Required]
        public string Measurement { get; set; }

        [Required]
        public string Quality { get; set; }

        [Required]
        [Range(0.01, 10000)]
        public decimal Price { get; set; }

        [MaxLength(250)] // Limit description to 250 characters
        public string Description { get; set; } // Added Description property

        public IFormFileCollection Photos { get; set; }
    }
}