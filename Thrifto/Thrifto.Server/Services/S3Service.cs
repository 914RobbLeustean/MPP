using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Configuration;
using System.Net;

namespace ThriftoServer.Services
{
    public interface IS3Service
    {
        Task<string> UploadFileAsync(IFormFile file, string folderName = "uploads");
        Task<bool> DeleteFileAsync(string fileUrl);
        Task<Stream> GetFileAsync(string fileUrl);
    }

    public class S3Service : IS3Service
    {
        private readonly IAmazonS3 _s3Client;
        private readonly string _bucketName;
        private readonly ILogger<S3Service> _logger;

        public S3Service(IAmazonS3 s3Client, IConfiguration configuration, ILogger<S3Service> logger)
        {
            _s3Client = s3Client;
            _bucketName = configuration["AWS:S3:BucketName"] ?? throw new ArgumentNullException("AWS:S3:BucketName not configured");
            _logger = logger;
        }

        public async Task<string> UploadFileAsync(IFormFile file, string folderName = "uploads")
        {
            try
            {
                if (file == null || file.Length == 0)
                    throw new ArgumentException("File is empty or null");

                var fileExtension = Path.GetExtension(file.FileName);
                var fileName = $"{folderName}/{Guid.NewGuid()}{fileExtension}";

                var request = new PutObjectRequest
                {
                    BucketName = _bucketName,
                    Key = fileName,
                    InputStream = file.OpenReadStream(),
                    ContentType = file.ContentType,
                    ServerSideEncryptionMethod = ServerSideEncryptionMethod.AES256,
                    CannedACL = S3CannedACL.PublicRead
                };

                var response = await _s3Client.PutObjectAsync(request);

                if (response.HttpStatusCode == HttpStatusCode.OK)
                {
                    return $"https://{_bucketName}.s3.amazonaws.com/{fileName}";
                }

                throw new Exception($"Failed to upload file to S3. Status: {response.HttpStatusCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file to S3");
                throw;
            }
        }

        public async Task<bool> DeleteFileAsync(string fileUrl)
        {
            try
            {
                var fileName = ExtractFileNameFromUrl(fileUrl);
                if (string.IsNullOrEmpty(fileName))
                    return false;

                var request = new DeleteObjectRequest
                {
                    BucketName = _bucketName,
                    Key = fileName
                };

                var response = await _s3Client.DeleteObjectAsync(request);
                return response.HttpStatusCode == HttpStatusCode.NoContent;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file from S3: {FileUrl}", fileUrl);
                return false;
            }
        }

        public async Task<Stream> GetFileAsync(string fileUrl)
        {
            try
            {
                var fileName = ExtractFileNameFromUrl(fileUrl);
                if (string.IsNullOrEmpty(fileName))
                    throw new ArgumentException("Invalid file URL");

                var request = new GetObjectRequest
                {
                    BucketName = _bucketName,
                    Key = fileName
                };

                var response = await _s3Client.GetObjectAsync(request);
                return response.ResponseStream;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting file from S3: {FileUrl}", fileUrl);
                throw;
            }
        }

        private string ExtractFileNameFromUrl(string fileUrl)
        {
            if (string.IsNullOrEmpty(fileUrl))
                return string.Empty;

            var uri = new Uri(fileUrl);
            return uri.AbsolutePath.TrimStart('/');
        }
    }
}