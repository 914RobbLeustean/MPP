// Hubs/ListingHub.cs
using Microsoft.AspNetCore.SignalR;
using ThriftoServer.DTOs;
using System.Threading.Tasks;

namespace ThriftoServer.Hubs
{
    public class ListingHub : Hub
    {
        public async Task NotifyNewListing(ListingDto listing)
        {
            await Clients.All.SendAsync("ReceiveNewListing", listing);
        }

        public async Task NotifyListingUpdated(ListingDto listing)
        {
            await Clients.All.SendAsync("ReceiveListingUpdate", listing);
        }

        public async Task NotifyListingDeleted(int listingId)
        {
            await Clients.All.SendAsync("ReceiveListingDelete", listingId);
        }

        public async Task NotifyChartUpdate(ChartDataDto chartData)
        {
            await Clients.All.SendAsync("ReceiveChartUpdate", chartData);
        }
    }

    public class ChartDataDto
    {
        public object PriceData { get; set; }
        public object QualityData { get; set; }
        public object TimeData { get; set; }
        public int TotalListings { get; set; }
        public decimal AveragePrice { get; set; }
        public decimal HighestPrice { get; set; }
    }
}