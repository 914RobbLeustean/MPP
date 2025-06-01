using Microsoft.AspNetCore.Identity;
using QRCoder;
using System.Drawing;
using System.Drawing.Imaging;
using System.Text;
using ThriftoServer.Models;

namespace ThriftoServer.Services
{
    public class TwoFactorService
    {
        private readonly UserManager<User> _userManager;
        private readonly IConfiguration _configuration;

        public TwoFactorService(UserManager<User> userManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _configuration = configuration;
        }

        public async Task<string> GenerateQrCodeAsync(User user)
        {
            var authenticatorKey = await _userManager.GetAuthenticatorKeyAsync(user);
            if (string.IsNullOrEmpty(authenticatorKey))
            {
                await _userManager.ResetAuthenticatorKeyAsync(user);
                authenticatorKey = await _userManager.GetAuthenticatorKeyAsync(user);
            }

            var appName = _configuration["AppName"] ?? "Thrifto";
            var qrCodeText = $"otpauth://totp/{appName}:{user.Email}?secret={authenticatorKey}&issuer={appName}";

            return GenerateQrCodeImage(qrCodeText);
        }

        public async Task<bool> VerifyTwoFactorTokenAsync(User user, string token)
        {
            return await _userManager.VerifyTwoFactorTokenAsync(user, _userManager.Options.Tokens.AuthenticatorTokenProvider, token);
        }

        public async Task<string[]> GenerateRecoveryCodesAsync(User user)
        {
            return (await _userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, 10)).ToArray();
        }

        private string GenerateQrCodeImage(string text)
        {
            using var qrGenerator = new QRCodeGenerator();
            using var qrCodeData = qrGenerator.CreateQrCode(text, QRCodeGenerator.ECCLevel.Q);
            using var qrCode = new PngByteQRCode(qrCodeData);
            var qrCodeBytes = qrCode.GetGraphic(20);
            return Convert.ToBase64String(qrCodeBytes);
        }
    }
}
