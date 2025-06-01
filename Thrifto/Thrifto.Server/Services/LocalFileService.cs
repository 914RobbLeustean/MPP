// src/app/Services/LocalFileService.cs
using Microsoft.Extensions.Configuration;

namespace ThriftoServer.Services
{
    public class LocalFileService : IS3Service
    {
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<LocalFileService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public LocalFileService(
            IWebHostEnvironment env,
            ILogger<LocalFileService> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _env = env;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<string> UploadFileAsync(IFormFile file, string folderName = "uploads")
        {
            try
            {
                if (file == null || file.Length == 0)
                    throw new ArgumentException("File is empty or null");

                // Create uploads directory if it doesn't exist
                var uploadsPath = Path.Combine(_env.WebRootPath, folderName);
                if (!Directory.Exists(uploadsPath))
                {
                    Directory.CreateDirectory(uploadsPath);
                }

                // Generate unique filename
                var fileExtension = Path.GetExtension(file.FileName);
                var fileName = $"{Guid.NewGuid()}{fileExtension}";
                var filePath = Path.Combine(uploadsPath, fileName);

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Generate URL using current request context
                var baseUrl = GetBaseUrl();
                var fileUrl = $"{baseUrl}/{folderName}/{fileName}";

                _logger.LogInformation("File uploaded locally: {FileUrl}", fileUrl);
                return fileUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file locally");
                throw;
            }
        }

        public async Task<bool> DeleteFileAsync(string fileUrl)
        {
            try
            {
                var fileName = ExtractFileNameFromLocalUrl(fileUrl);
                if (string.IsNullOrEmpty(fileName))
                    return false;

                var filePath = Path.Combine(_env.WebRootPath, fileName);

                if (File.Exists(filePath))
                {
                    await Task.Run(() => File.Delete(filePath));
                    _logger.LogInformation("File deleted locally: {FilePath}", filePath);
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting local file: {FileUrl}", fileUrl);
                return false;
            }
        }

        public async Task<Stream> GetFileAsync(string fileUrl)
        {
            try
            {
                var fileName = ExtractFileNameFromLocalUrl(fileUrl);
                if (string.IsNullOrEmpty(fileName))
                    throw new ArgumentException("Invalid file URL");

                var filePath = Path.Combine(_env.WebRootPath, fileName);

                if (!File.Exists(filePath))
                    throw new FileNotFoundException($"File not found: {fileName}");

                return await Task.FromResult(new FileStream(filePath, FileMode.Open, FileAccess.Read));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting local file: {FileUrl}", fileUrl);
                throw;
            }
        }

        private string GetBaseUrl()
        {
            var request = _httpContextAccessor.HttpContext?.Request;
            if (request != null)
            {
                var scheme = request.Scheme;
                var host = request.Host.Value;
                return $"{scheme}://{host}";
            }

            // Fallback if no HTTP context (shouldn't happen in web requests)
            return "https://localhost:7081";
        }

        private string ExtractFileNameFromLocalUrl(string fileUrl)
        {
            if (string.IsNullOrEmpty(fileUrl))
                return string.Empty;

            try
            {
                var uri = new Uri(fileUrl);
                // Remove leading slash and return path like "uploads/filename.jpg"
                return uri.AbsolutePath.TrimStart('/');
            }
            catch
            {
                return string.Empty;
            }
        }
    }
}