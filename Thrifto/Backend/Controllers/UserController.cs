// Controllers/UserController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using ThriftoServer.DTOs;
using ThriftoServer.Models;
using ThriftoServer.Services;

namespace ThriftoServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly FeedbackService _feedbackService;

        public UserController(UserManager<User> userManager, FeedbackService feedbackService)
        {
            _userManager = userManager;
            _feedbackService = feedbackService;
        }

        [HttpGet("{userId}")]
        public async Task<ActionResult<UserDto>> GetUser(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null || !user.IsActive) return NotFound();

            var averageRating = await _feedbackService.GetAverageRatingAsync(userId);

            return Ok(new UserDto
            {
                Id = user.Id,
                Username = user.UserName,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName
            });
        }

        [Authorize]
        [HttpGet("current")]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (userId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);

            if (user == null) return NotFound();

            return new UserDto
            {
                Id = user.Id,
                Username = user.UserName,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName
            };
        }
    }
}