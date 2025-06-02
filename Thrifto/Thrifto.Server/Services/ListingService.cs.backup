using Azure.Core;
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
    public class PaginatedResult<T>
    {
        public IEnumerable<T> Items { get; set; }
        public int TotalCount { get; set; }
    }

    public class ListingService
    {
        private readonly AppDbContext _context;
        private readonly FileService _fileService;

        public ListingService(AppDbContext context, FileService fileService)
        {
            _context = context;
            _fileService = fileService;
        }

        public async Task<PaginatedResult<ListingDto>> GetListingsAsync(int page = 1, int pageSize = 10, string quality = null, string sortBy = "newest")
        {
            var query = _context.Listings
                .Include(l => l.Photos)
                .Include(l => l.User)
                .Where(l => l.IsActive)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(quality))
            {
                query = query.Where(l => l.Quality == quality);
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Apply sorting
            query = sortBy.ToLower() switch
            {
                "price_asc" => query.OrderBy(l => l.Price),
                "price_desc" => query.OrderByDescending(l => l.Price),
                "oldest" => query.OrderBy(l => l.CreatedAt),
                _ => query.OrderByDescending(l => l.CreatedAt) // "newest" is default
            };

            // Apply pagination
            var pagedItems = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PaginatedResult<ListingDto>
            {
                Items = pagedItems.Select(MapListingToDto),
                TotalCount = totalCount
            };
        }

        public async Task<IEnumerable<ListingDto>> GetNewListingsAsync(int count = 20)
        {
            var listings = await _context.Listings
                .Include(l => l.Photos)
                .Include(l => l.User)
                .Where(l => l.IsActive)
                .OrderByDescending(l => l.CreatedAt)
                .Take(count)
                .ToListAsync();

            return listings.Select(MapListingToDto);
        }

        public async Task<ListingDto> GetListingByIdAsync(int id)   
        {
            var listing = await _context.Listings
                .Include(l => l.Photos)
                .Include(l => l.User)
                .FirstOrDefaultAsync(l => l.Id == id && l.IsActive);

            return listing == null ? null : MapListingToDto(listing);
        }

        public async Task<IEnumerable<ListingDto>> GetListingsByUserIdAsync(string userId)
        {
            var listings = await _context.Listings
                .Include(l => l.Photos)
                .Include(l => l.User)
                .Where(l => l.UserId == userId && l.IsActive)
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync();

            return listings.Select(MapListingToDto);
        }

        public async Task<ListingDto> CreateListingAsync(ListingCreateDto listingDto, string userId)
        {
            var listing = new Listing
            {
                Title = listingDto.Title,
                Measurement = listingDto.Measurement,
                Quality = listingDto.Quality,
                Price = listingDto.Price,
                UserId = userId,
                Description = listingDto.Description,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.Listings.Add(listing);
            await _context.SaveChangesAsync();

            if (listingDto.Photos != null && listingDto.Photos.Count > 0)
            {
                var photos = new List<ListingPhoto>();

                for (var i = 0; i < listingDto.Photos.Count; i++)
                {
                    var photo = listingDto.Photos.ElementAt(i);
                    if (photo != null && photo.Length > 0)
                    {
                        var photoUrl = await _fileService.SaveFileAsync(photo);

                        photos.Add(new ListingPhoto
                        {
                            Url = photoUrl,
                            IsMain = i == 0,
                            PublicId = Guid.NewGuid().ToString(),
                            ListingId = listing.Id
                        });
                    }
                }

                _context.ListingPhotos.AddRange(photos);
                await _context.SaveChangesAsync();
            }

            return await GetListingByIdAsync(listing.Id);
        }

        public async Task<ListingDto> UpdateListingAsync(int id, ListingUpdateDto listingDto)
        {
            var listing = await _context.Listings
                .Include(l => l.Photos)
                .FirstOrDefaultAsync(l => l.Id == id && l.IsActive);

            if (listing == null)
            {
                return null;
            }

            if (!string.IsNullOrEmpty(listingDto.Title))
                listing.Title = listingDto.Title;

            if (!string.IsNullOrEmpty(listingDto.Measurement))
                listing.Measurement = listingDto.Measurement;

            if (!string.IsNullOrEmpty(listingDto.Quality))
                listing.Quality = listingDto.Quality;

            if (listingDto.Price.HasValue)
                listing.Price = listingDto.Price.Value;

            listing.Description = listingDto.Description;

            if (listingDto.DeleteExistingPhotos && listing.Photos.Any())
            {
                foreach (var photo in listing.Photos)
                {
                    await _fileService.DeleteFileAsync(photo.Url);
                }

                _context.ListingPhotos.RemoveRange(listing.Photos);
            }

            if (listingDto.Photos != null && listingDto.Photos.Count > 0)
            {
                var newPhotos = new List<ListingPhoto>();
                bool isFirst = !listing.Photos.Any();

                for (var i = 0; i < listingDto.Photos.Count; i++)
                {
                    var photo = listingDto.Photos.ElementAt(i);
                    if (photo != null && photo.Length > 0)
                    {
                        var photoUrl = await _fileService.SaveFileAsync(photo);

                        newPhotos.Add(new ListingPhoto
                        {
                            Url = photoUrl,
                            IsMain = isFirst && i == 0,
                            PublicId = Guid.NewGuid().ToString(),
                            ListingId = listing.Id
                        });
                    }
                }

                if (newPhotos.Any())
                {
                    _context.ListingPhotos.AddRange(newPhotos);
                }
            }

            await _context.SaveChangesAsync();

            return await GetListingByIdAsync(listing.Id);
        }

        public async Task DeleteListingAsync(int id)
        {
            var listing = await _context.Listings.FindAsync(id);

            if (listing != null)
            {
                listing.IsActive = false;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<IEnumerable<ListingDto>> SearchListingsAsync(string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return Enumerable.Empty<ListingDto>();

            var normalizedSearchTerm = searchTerm.ToLower();

            var listings = await _context.Listings
                .Include(l => l.Photos)
                .Include(l => l.User)
                .Where(l => l.IsActive &&
                            (l.Title.ToLower().Contains(normalizedSearchTerm) ||
                             l.Measurement.ToLower().Contains(normalizedSearchTerm) ||
                             l.Quality.ToLower().Contains(normalizedSearchTerm)))
                .OrderByDescending(l => l.CreatedAt)
                .Take(20)
                .ToListAsync();

            return listings.Select(MapListingToDto);
        }

        private ListingDto MapListingToDto(Listing listing)
        {
            return new ListingDto
            {
                Id = listing.Id,
                Title = listing.Title,
                Measurement = listing.Measurement,
                Quality = listing.Quality,
                Price = listing.Price,
                Description = listing.Description,
                CreatedAt = listing.CreatedAt,
                UserId = listing.UserId,
                UserName = listing.User?.UserName,
                PhotoUrls = listing.Photos?.Select(p => p.Url).ToList() ?? new List<string>(),
                MainPhotoUrl = listing.Photos?.FirstOrDefault(p => p.IsMain)?.Url ??
                               listing.Photos?.FirstOrDefault()?.Url
            };
        }
    }
}
