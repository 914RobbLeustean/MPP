// DTOs/ListingUpdateDto.cs
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace ThriftoServer.DTOs
{
    public class ListingUpdateDto
    {
        public string Title { get; set; }
        public string Measurement { get; set; }
        public string Quality { get; set; }

        [Range(0.01, 10000)]
        public decimal? Price { get; set; }
        [MaxLength(250)] // Limit description to 250 characters
        public string Description { get; set; }
        public List<IFormFile> Photos { get; set; } = new List<IFormFile>();


        public bool DeleteExistingPhotos { get; set; }
    }
}