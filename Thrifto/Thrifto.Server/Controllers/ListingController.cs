// Controllers/ListingsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using ThriftoServer.Attributes;
using ThriftoServer.DTOs;
using ThriftoServer.Services;

namespace ThriftoServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ListingsController : ControllerBase
    {
        private readonly ListingService _listingService;

        public ListingsController(ListingService listingService)
        {
            _listingService = listingService;
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedResult<ListingDto>>> GetListings(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string quality = null,
            [FromQuery] string sortBy = "newest",
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null)
        {
            var result = await _listingService.GetListingsAsync(page, pageSize, quality, sortBy, minPrice, maxPrice);
            return Ok(result);
        }

        [HttpGet("new")]
        public async Task<ActionResult<IEnumerable<ListingDto>>> GetNewListings([FromQuery] int count = 20)
        {
            var listings = await _listingService.GetNewListingsAsync(count);
            return Ok(listings);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ListingDto>> GetListing(int id)
        {
            var listing = await _listingService.GetListingByIdAsync(id);

            if (listing == null) return NotFound();

            return Ok(listing);
        }

        [Authorize]
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<ListingDto>>> GetUserListings(string userId)
        {
            var listings = await _listingService.GetListingsByUserIdAsync(userId);
            return Ok(listings);
        }

        [Authorize]
        [HttpPost]
        public async Task<ActionResult<ListingDto>> CreateListing([FromForm] ListingCreateDto listingDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (userId == null) return Unauthorized();

            var listing = await _listingService.CreateListingAsync(listingDto, userId);

            return CreatedAtAction(nameof(GetListing), new { id = listing.Id }, listing);
        }

        [Authorize]
        [HttpPut("{id}")]
        [PhotosOptionalForUpdate] // Apply our custom attribute
        public async Task<ActionResult<ListingDto>> UpdateListing(int id, [FromForm] ListingUpdateDto listingDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var existingListing = await _listingService.GetListingByIdAsync(id);

            if (existingListing == null)
                return NotFound();

            if (existingListing.UserId != userId)
                return Forbid();

            var updatedListing = await _listingService.UpdateListingAsync(id, listingDto);
            return Ok(updatedListing);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteListing(int id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var listing = await _listingService.GetListingByIdAsync(id);

            if (listing == null) return NotFound();

            if (listing.UserId != userId) return Forbid();

            await _listingService.DeleteListingAsync(id);

            return NoContent();
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<ListingDto>>> SearchListings(
            [FromQuery] string q,
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null)
        {
            if (string.IsNullOrEmpty(q)) return BadRequest("Search query cannot be empty");

            var listings = await _listingService.SearchListingsAsync(q, minPrice, maxPrice);

            return Ok(listings);
        }
    }
}