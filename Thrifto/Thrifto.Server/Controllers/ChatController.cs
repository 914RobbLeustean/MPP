// Controllers/ChatController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using ThriftoServer.DTOs;
using ThriftoServer.Services;

namespace ThriftoServer.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly ChatService _chatService;

        public ChatController(ChatService chatService)
        {
            _chatService = chatService;
        }

        [HttpGet("conversations")]
        public async Task<ActionResult<IEnumerable<ConversationDto>>> GetConversations()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (userId == null) return Unauthorized();

            var conversations = await _chatService.GetConversationsAsync(userId);

            return Ok(conversations);
        }

        [HttpGet("messages/{userId}")]
        public async Task<ActionResult<IEnumerable<MessageDto>>> GetMessages(string userId)
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (currentUserId == null) return Unauthorized();

            var messages = await _chatService.GetMessagesAsync(currentUserId, userId);

            return Ok(messages);
        }

        [HttpPost("messages")]
        public async Task<ActionResult<MessageDto>> SendMessage(MessageCreateDto messageDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (userId == null) return Unauthorized();

            var message = await _chatService.CreateMessageAsync(userId, messageDto.ReceiverId, messageDto.Content);

            return Ok(message);
        }

        [HttpPut("read/{userId}")]
        public async Task<ActionResult> MarkAsRead(string userId)
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (currentUserId == null) return Unauthorized();

            await _chatService.MarkMessagesAsReadAsync(userId, currentUserId);

            return NoContent();
        }
    }
}