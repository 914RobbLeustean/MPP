// Controllers/FeedbackController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using ThriftoServer.DTOs;
using ThriftoServer.Services;

namespace ThriftoServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FeedbackController : ControllerBase
    {
        private readonly FeedbackService _feedbackService;

        public FeedbackController(FeedbackService feedbackService)
        {
            _feedbackService = feedbackService;
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<FeedbackDto>>> GetUserFeedback(string userId)
        {
            var feedback = await _feedbackService.GetUserFeedbackAsync(userId);
            return Ok(feedback);
        }

        [HttpGet("user/{userId}/rating")]
        public async Task<ActionResult<double>> GetUserRating(string userId)
        {
            var averageRating = await _feedbackService.GetAverageRatingAsync(userId);
            return Ok(averageRating);
        }

        [Authorize]
        [HttpPost]
        public async Task<ActionResult<FeedbackDto>> CreateFeedback(FeedbackCreateDto feedbackDto)
        {
            var reviewerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (reviewerId == null) return Unauthorized();

            // Prevent users from reviewing themselves
            if (reviewerId == feedbackDto.UserId)
                return BadRequest("You cannot leave feedback for yourself");

            var feedback = await _feedbackService.CreateFeedbackAsync(reviewerId, feedbackDto);

            return CreatedAtAction(nameof(GetUserFeedback), new { userId = feedbackDto.UserId }, feedback);
        }
    }
}