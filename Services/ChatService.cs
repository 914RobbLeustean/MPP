// Services/ChatService.cs
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ThriftoServer.Data;
using ThriftoServer.DTOs;
using ThriftoServer.Models;

namespace ThriftoServer.Services
{
    public class ChatService
    {
        private readonly AppDbContext _context;

        public ChatService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ConversationDto>> GetConversationsAsync(string userId)
        {
            // Get all users the current user has chatted with
            var userIds = await _context.ChatMessages
                .Where(m => m.SenderId == userId || m.ReceiverId == userId)
                .Select(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
                .Distinct()
                .ToListAsync();

            var conversations = new List<ConversationDto>();

            foreach (var id in userIds)
            {
                var user = await _context.Users.FindAsync(id);

                if (user == null)
                {
                    continue;
                }

                // Get the last message
                var lastMessage = await _context.ChatMessages
                    .Where(m => (m.SenderId == userId && m.ReceiverId == id) ||
                               (m.SenderId == id && m.ReceiverId == userId))
                    .OrderByDescending(m => m.SentAt)
                    .FirstOrDefaultAsync();

                if (lastMessage == null)
                {
                    continue;
                }

                // Count unread messages
                var unreadCount = await _context.ChatMessages
                    .CountAsync(m => m.SenderId == id &&
                                     m.ReceiverId == userId &&
                                     !m.IsRead);

                conversations.Add(new ConversationDto
                {
                    UserId = id,
                    Username = user.UserName,
                    LastMessage = lastMessage.Content,
                    LastMessageTimestamp = lastMessage.SentAt,
                    UnreadCount = unreadCount
                });
            }

            // Sort by the most recent message
            return conversations.OrderByDescending(c => c.LastMessageTimestamp);
        }

        public async Task<IEnumerable<MessageDto>> GetMessagesAsync(string currentUserId, string userId)
        {
            var messages = await _context.ChatMessages
                .Where(m => (m.SenderId == currentUserId && m.ReceiverId == userId) ||
                           (m.SenderId == userId && m.ReceiverId == currentUserId))
                .OrderBy(m => m.SentAt)
                .Select(m => new MessageDto
                {
                    Id = m.Id,
                    SenderId = m.SenderId,
                    Content = m.Content,
                    Timestamp = m.SentAt,
                    IsFromCurrentUser = m.SenderId == currentUserId
                })
                .ToListAsync();

            return messages;
        }

        public async Task<MessageDto> CreateMessageAsync(string senderId, string receiverId, string content)
        {
            var message = new ChatMessage
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Content = content,
                SentAt = DateTime.UtcNow,
                IsRead = false
            };

            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();

            return new MessageDto
            {
                Id = message.Id,
                SenderId = message.SenderId,
                Content = message.Content,
                Timestamp = message.SentAt,
                IsFromCurrentUser = true
            };
        }

        public async Task MarkMessagesAsReadAsync(string senderId, string receiverId)
        {
            var unreadMessages = await _context.ChatMessages
                .Where(m => m.SenderId == senderId &&
                           m.ReceiverId == receiverId &&
                           !m.IsRead)
                .ToListAsync();

            foreach (var message in unreadMessages)
            {
                message.IsRead = true;
            }

            await _context.SaveChangesAsync();
        }
    }
}