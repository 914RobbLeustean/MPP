// src/app/models/two-factor.model.ts
export interface TwoFactorSetupDto {
    qrCode: string;
    manualEntryKey: string;
    recoveryCodes?: string[];
}

export interface EnableTwoFactorDto {
    code: string;
}

export interface TwoFactorLoginDto {
    email: string;
    code: string;
    useRecoveryCode?: boolean;
}

export interface LoginResponse {
    requiresTwoFactor?: boolean;
    email?: string;
    // User properties when login is successful
    id?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    token?: string;
}

export interface TwoFactorStatusResponse {
    twoFactorEnabled: boolean;
}