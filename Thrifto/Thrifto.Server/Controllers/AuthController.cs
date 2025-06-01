// Controllers/AuthController.cs
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
    public class AuthController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly TokenService _tokenService;
        private readonly TwoFactorService _twoFactorService;

        public AuthController(UserManager<User> userManager, TokenService tokenService, TwoFactorService twoFactorService)
        {
            _userManager = userManager;
            _tokenService = tokenService;
            _twoFactorService = twoFactorService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<UserDto>> Register(RegisterDto registerDto)
        {
            if (await _userManager.FindByEmailAsync(registerDto.Email) != null)
            {
                return BadRequest("Email is already taken");
            }
            if (await _userManager.FindByNameAsync(registerDto.Username) != null)
            {
                return BadRequest("Username is already taken");
            }

            var user = new User
            {
                Email = registerDto.Email,
                UserName = registerDto.Username,
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName
            };

            var result = await _userManager.CreateAsync(user, registerDto.Password);
            if (!result.Succeeded) return BadRequest(result.Errors);

            return new UserDto
            {
                Id = user.Id,
                Username = user.UserName,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Token = _tokenService.CreateToken(user)
            };
        }

        [HttpPost("login")]
        public async Task<ActionResult<object>> Login(LoginDto loginDto)
        {
            var user = await _userManager.FindByEmailAsync(loginDto.Email);
            if (user == null) return Unauthorized("Invalid email or password");
            if (!user.IsActive) return Unauthorized("Account is deactivated");

            var result = await _userManager.CheckPasswordAsync(user, loginDto.Password);
            if (!result) return Unauthorized("Invalid email or password");

            // Check if 2FA is enabled
            var isTwoFactorEnabled = await _userManager.GetTwoFactorEnabledAsync(user);
            if (isTwoFactorEnabled)
            {
                return Ok(new { RequiresTwoFactor = true, Email = user.Email });
            }

            return Ok(new UserDto
            {
                Id = user.Id,
                Username = user.UserName,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Token = _tokenService.CreateToken(user)
            });
        }

        [HttpGet("2fa/setup")]
        [Authorize]
        public async Task<ActionResult<TwoFactorSetupDto>> Setup2FA()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(userId);
            
            if (user == null) return NotFound();

            var qrCode = await _twoFactorService.GenerateQrCodeAsync(user);
            var authenticatorKey = await _userManager.GetAuthenticatorKeyAsync(user);

            return Ok(new TwoFactorSetupDto 
            { 
                QrCode = qrCode,
                ManualEntryKey = authenticatorKey
            });
        }

        [HttpPost("2fa/enable")]
        [Authorize]
        public async Task<IActionResult> Enable2FA(EnableTwoFactorDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(userId);
            
            if (user == null) return NotFound();

            var isValidToken = await _twoFactorService.VerifyTwoFactorTokenAsync(user, dto.Code);
            if (!isValidToken)
                return BadRequest("Invalid verification code");

            await _userManager.SetTwoFactorEnabledAsync(user, true);
            var recoveryCodes = await _twoFactorService.GenerateRecoveryCodesAsync(user);

            return Ok(new TwoFactorSetupDto { RecoveryCodes = recoveryCodes });
        }

        [HttpPost("2fa/verify")]
        public async Task<ActionResult<UserDto>> VerifyTwoFactor(TwoFactorLoginDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null) return Unauthorized("Invalid credentials");

            bool isValidCode;
            if (dto.UseRecoveryCode)
            {
                var result = await _userManager.RedeemTwoFactorRecoveryCodeAsync(user, dto.Code);
                isValidCode = result.Succeeded;
            }
            else
            {
                isValidCode = await _twoFactorService.VerifyTwoFactorTokenAsync(user, dto.Code);
            }

            if (!isValidCode)
                return Unauthorized("Invalid verification code");

            var token = _tokenService.CreateToken(user);
            return Ok(new UserDto 
            { 
                Id = user.Id,
                Username = user.UserName, 
                Token = token,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName
            });
        }

        [HttpPost("2fa/disable")]
        [Authorize]
        public async Task<IActionResult> Disable2FA()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(userId);
            
            if (user == null) return NotFound();

            await _userManager.SetTwoFactorEnabledAsync(user, false);
            return Ok(new { Message = "Two-factor authentication disabled" });
        }

        [HttpGet("2fa/status")]
        [Authorize]  
        public async Task<ActionResult<object>> Get2FAStatus()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(userId);
            
            if (user == null) return NotFound();

            var isEnabled = await _userManager.GetTwoFactorEnabledAsync(user);
            return Ok(new { TwoFactorEnabled = isEnabled });
        }
    }
}
