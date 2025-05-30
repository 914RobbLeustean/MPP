// Models/User.cs
using Microsoft.AspNetCore.Identity;
using System.Collections.Generic;

namespace ThriftoServer.Models
{
    public class User : IdentityUser
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public DateTime Created { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public ICollection<Listing> Listings { get; set; }
        public ICollection<ChatMessage> SentMessages { get; set; }
        public ICollection<ChatMessage> ReceivedMessages { get; set; }
        public ICollection<Feedback> GivenFeedbacks { get; set; }
        public ICollection<Feedback> ReceivedFeedbacks { get; set; }
    }
}