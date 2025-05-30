// Controllers/StatsController.cs
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using ThriftoServer.DTOs;
using ThriftoServer.Services;

namespace ThriftoServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StatsController : ControllerBase
    {
        private readonly StatsService _statsService;

        public StatsController(StatsService statsService)
        {
            _statsService = statsService;
        }

        [HttpGet("marketplace")]
        public async Task<ActionResult<MarketplaceStatsDto>> GetMarketplaceStats()
        {
            var stats = await _statsService.GetMarketplaceStatisticsAsync();
            return Ok(stats);
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<UserStatsDto>> GetUserStats(string userId)
        {
            var stats = await _statsService.GetUserStatisticsAsync(userId);
            if (stats == null)
                return NotFound();

            return Ok(stats);
        }
    }
}