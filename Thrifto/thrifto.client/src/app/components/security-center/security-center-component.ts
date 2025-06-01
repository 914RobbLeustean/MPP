// src/app/components/security-center/security-center.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

interface SecurityActivity {
    id: string;
    type: 'login' | 'security' | 'password' | 'device';
    title: string;
    description: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high';
}

@Component({
    selector: 'app-security-center',
    templateUrl: './security-center.component.html',
    styleUrls: ['./security-center.component.scss']
})
export class SecurityCenterComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    // Security Status
    securityScore = 75;
    twoFactorEnabled = false;
    strongPassword = true;
    recentActivity = true;
    emailVerified = true;
    securityNotifications = true;

    // Activity Data
    lastLoginDate = new Date();
    activeDevices = 3;
    profileVisibility = 'Private';
    lastDataExport: Date | null = null;

    securityActivity: SecurityActivity[] = [
        {
            id: '1',
            type: 'login',
            title: 'Successful Login',
            description: 'Logged in from Chrome on Windows',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            severity: 'low'
        },
        {
            id: '2',
            type: 'security',
            title: 'Two-Factor Authentication Enabled',
            description: 'You enabled 2FA for your account',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            severity: 'low'
        },
        {
            id: '3',
            type: 'password',
            title: 'Password Changed',
            description: 'Account password was updated',
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
            severity: 'medium'
        }
    ];

    constructor(
        private authService: AuthService,
        private notificationService: NotificationService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadSecurityStatus();
        this.calculateSecurityScore();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadSecurityStatus(): void {
        this.authService.get2FAStatus()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    this.twoFactorEnabled = response.twoFactorEnabled;
                    this.calculateSecurityScore();
                },
                error: (error) => {
                    console.error('Failed to load security status:', error);
                }
            });
    }

    private calculateSecurityScore(): void {
        let score = 0;

        if (this.twoFactorEnabled) score += 30;
        if (this.strongPassword) score += 25;
        if (this.emailVerified) score += 20;
        if (this.recentActivity) score += 15;
        if (this.securityNotifications) score += 10;

        this.securityScore = score;
    }

    getSecurityScoreClass(): string {
        if (this.securityScore >= 85) return 'excellent';
        if (this.securityScore >= 70) return 'good';
        if (this.securityScore >= 50) return 'fair';
        return 'poor';
    }

    getSecurityScoreDescription(): string {
        if (this.securityScore >= 85) return 'Excellent security! Your account is well protected.';
        if (this.securityScore >= 70) return 'Good security. Consider enabling more features.';
        if (this.securityScore >= 50) return 'Fair security. Some improvements needed.';
        return 'Poor security. Please improve your account protection.';
    }

    getActivityIcon(type: string): string {
        const icons = {
            login: 'fa-sign-in-alt',
            security: 'fa-shield-alt',
            password: 'fa-key',
            device: 'fa-mobile-alt'
        };

        if (type in icons) {
            return icons[type as keyof typeof icons];
        }
        return 'fa-info-circle';
    }


    getActivityIconClass(type: string): string {
        return type;
    }

    // Navigation Methods
    navigateToAccountSettings(): void {
        this.router.navigate(['/account-settings']);
    }

    navigateToSecurityHelp(): void {
        this.router.navigate(['/security-help']);
    }

    // Action Methods
    improveSecurityScore(): void {
        if (!this.twoFactorEnabled) {
            this.navigateToAccountSettings();
            return;
        }

        this.notificationService.show('Review security recommendations to improve your score', 'info');
    }

    viewLoginHistory(): void {
        this.notificationService.show('Login history feature coming soon', 'info');
    }

    manageDevices(): void {
        this.notificationService.show('Device management feature coming soon', 'info');
    }

    managePrivacy(): void {
        this.notificationService.show('Privacy settings feature coming soon', 'info');
    }

    manageNotifications(): void {
        this.notificationService.show('Notification settings feature coming soon', 'info');
    }

    downloadData(): void {
        this.notificationService.show('Data export initiated. You will receive an email when ready.', 'success');
        this.lastDataExport = new Date();
    }

    viewAllActivity(): void {
        this.notificationService.show('Full activity log feature coming soon', 'info');
    }

    contactSecurity(): void {
        this.notificationService.show('Security support contact feature coming soon', 'info');
    }
}