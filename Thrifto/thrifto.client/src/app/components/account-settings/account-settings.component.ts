// src/app/components/account-settings/account-settings.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router'; // ADD: Router import
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { TwoFactorSetupDto } from '../../models/two-factor.model';
import { User } from '../../models/user.model';

@Component({
    selector: 'app-account-settings',
    templateUrl: './account-settings.component.html',
    styleUrls: ['./account-settings.component.scss']
})
export class AccountSettingsComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    currentUser: User | null = null;
    twoFactorEnabled = false;
    isLoading = true;
    isSubmitting = false;

    // 2FA Setup
    setupForm: FormGroup;
    setupData: TwoFactorSetupDto | null = null;
    showSetupForm = false;
    recoveryCodes: string[] = [];
    showRecoveryCodes = false;

    constructor(
        private authService: AuthService,
        private notificationService: NotificationService,
        private formBuilder: FormBuilder,
        private router: Router // ADD: Router injection
    ) {
        this.setupForm = this.formBuilder.group({
            code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
        });
    }

    ngOnInit(): void {
        this.currentUser = this.authService.getCurrentUser();
        this.loadTwoFactorStatus();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get f() {
        return this.setupForm.controls;
    }

    // ADD: Navigation methods for the CTA buttons
    navigateToSecurityCenter(): void {
        this.router.navigate(['/security-center']);
    }

    navigateToSecurityHelp(): void {
        this.router.navigate(['/security-help']);
    }

    // Existing methods remain unchanged...
    private loadTwoFactorStatus(): void {
        this.authService.get2FAStatus()
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.isLoading = false)
            )
            .subscribe({
                next: (response) => {
                    this.twoFactorEnabled = response.twoFactorEnabled;
                },
                error: (error) => {
                    console.error('Failed to load 2FA status:', error);
                    this.notificationService.show('Failed to load security settings', 'error');
                }
            });
    }

    startTwoFactorSetup(): void {
        this.isSubmitting = true;

        this.authService.setup2FA()
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.isSubmitting = false)
            )
            .subscribe({
                next: (response) => {
                    this.setupData = response;
                    this.showSetupForm = true;
                },
                error: (error) => {
                    console.error('Failed to setup 2FA:', error);
                    this.notificationService.show('Failed to generate authentication setup', 'error');
                }
            });
    }

    enableTwoFactor(): void {
        if (this.setupForm.invalid) {
            this.setupForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;

        this.authService.enable2FA(this.f['code'].value)
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.isSubmitting = false)
            )
            .subscribe({
                next: (response) => {
                    this.twoFactorEnabled = true;
                    this.showSetupForm = false;
                    this.recoveryCodes = response.recoveryCodes || [];
                    this.showRecoveryCodes = true;
                    this.setupForm.reset();
                    this.notificationService.show('Two-factor authentication enabled successfully!', 'success');
                },
                error: (error) => {
                    console.error('Failed to enable 2FA:', error);
                    const errorMessage = error.error?.message || 'Invalid verification code. Please try again.';
                    this.notificationService.show(errorMessage, 'error');
                }
            });
    }

    disableTwoFactor(): void {
        const confirmMessage = 'Are you sure you want to disable two-factor authentication?\n\nThis will make your account less secure.';

        if (!confirm(confirmMessage)) {
            return;
        }

        this.isSubmitting = true;

        this.authService.disable2FA()
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.isSubmitting = false)
            )
            .subscribe({
                next: () => {
                    this.twoFactorEnabled = false;
                    this.notificationService.show('Two-factor authentication has been disabled', 'success');
                },
                error: (error) => {
                    console.error('Failed to disable 2FA:', error);
                    this.notificationService.show('Failed to disable two-factor authentication', 'error');
                }
            });
    }

    cancelSetup(): void {
        this.showSetupForm = false;
        this.setupData = null;
        this.setupForm.reset();
    }

    copyManualKey(): void {
        if (!this.setupData?.manualEntryKey) {
            return;
        }

        navigator.clipboard.writeText(this.setupData.manualEntryKey).then(() => {
            this.notificationService.show('Authentication key copied to clipboard', 'success');
        }).catch(() => {
            this.notificationService.show('Failed to copy key', 'error');
        });
    }

    downloadRecoveryCodes(): void {
        if (this.recoveryCodes.length === 0) {
            return;
        }

        const content = [
            'Thrifto Account Recovery Codes',
            '================================',
            '',
            'These codes can be used to access your account if you lose access to your authenticator app.',
            'Each code can only be used once.',
            '',
            'Generated on: ' + new Date().toLocaleString(),
            '',
            ...this.recoveryCodes.map((code, index) => `${index + 1}. ${code}`)
        ].join('\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `thrifto-recovery-codes-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(url);
        this.notificationService.show('Recovery codes downloaded successfully', 'success');
    }

    copyRecoveryCodes(): void {
        if (this.recoveryCodes.length === 0) {
            return;
        }

        const content = this.recoveryCodes.join('\n');

        navigator.clipboard.writeText(content).then(() => {
            this.notificationService.show('Recovery codes copied to clipboard', 'success');
        }).catch(() => {
            this.notificationService.show('Failed to copy recovery codes', 'error');
        });
    }

    acknowledgeRecoveryCodes(): void {
        this.showRecoveryCodes = false;
        this.recoveryCodes = [];
    }
}