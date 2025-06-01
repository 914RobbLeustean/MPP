namespace ThriftoServer.DTOs
{
    public class TwoFactorSetupDto
    {
        public string QrCode { get; set; }
        public string ManualEntryKey { get; set; }
        public string[] RecoveryCodes { get; set; }
    }

    public class EnableTwoFactorDto
    {
        public string Code { get; set; }
    }

    public class TwoFactorLoginDto
    {
        public string Email { get; set; }
        public string Code { get; set; }
        public bool UseRecoveryCode { get; set; } = false;
    }
}
