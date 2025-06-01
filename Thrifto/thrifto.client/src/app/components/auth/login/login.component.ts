// src/app/components/auth/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { TwoFactorLoginDto } from '../../../models/two-factor.model';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
    loginForm: FormGroup;
    twoFactorForm: FormGroup;
    isSubmitting = false;
    returnUrl: string = '/';
    showTwoFactorForm = false;
    userEmail = '';

    constructor(
        private formBuilder: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute,
        private notificationService: NotificationService
    ) {
        // Redirect if already logged in
        if (this.authService.isLoggedIn()) {
            this.router.navigate(['/']);
        }

        this.loginForm = this.formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required]
        });

        this.twoFactorForm = this.formBuilder.group({
            code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
            useRecoveryCode: [false]
        });
    }

    ngOnInit(): void {
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    }

    get f() { return this.loginForm.controls; }
    get tf() { return this.twoFactorForm.controls; }

    onSubmit(): void {
        if (this.loginForm.invalid) {
            return;
        }

        this.isSubmitting = true;
        this.authService.login(this.f['email'].value, this.f['password'].value)
            .subscribe({
                next: (response) => {
                    if (response.requiresTwoFactor) {
                        this.userEmail = response.email!;
                        this.showTwoFactorForm = true;
                        this.isSubmitting = false;
                        this.notificationService.show('Please enter your 2FA code', 'info');
                    } else {
                        this.notificationService.show('Login successful', 'success');
                        this.router.navigate([this.returnUrl]);
                    }
                },
                error: error => {
                    this.isSubmitting = false;
                    this.notificationService.show(error.error?.message || 'Login failed', 'error');
                }
            });
    }

    onTwoFactorSubmit(): void {
        if (this.twoFactorForm.invalid) {
            return;
        }

        this.isSubmitting = true;
        const twoFactorData: TwoFactorLoginDto = {
            email: this.userEmail,
            code: this.tf['code'].value,
            useRecoveryCode: this.tf['useRecoveryCode'].value
        };

        this.authService.verifyTwoFactor(twoFactorData)
            .subscribe({
                next: () => {
                    this.notificationService.show('Login successful', 'success');
                    this.router.navigate([this.returnUrl]);
                },
                error: error => {
                    this.isSubmitting = false;
                    this.notificationService.show(error.error?.message || 'Invalid verification code', 'error');
                }
            });
    }

    toggleRecoveryCode(): void {
        const useRecovery = !this.tf['useRecoveryCode'].value;
        this.tf['useRecoveryCode'].setValue(useRecovery);

        if (useRecovery) {
            this.tf['code'].setValidators([Validators.required]);
        } else {
            this.tf['code'].setValidators([Validators.required, Validators.pattern(/^\d{6}$/)]);
        }
        this.tf['code'].updateValueAndValidity();
    }

    backToLogin(): void {
        this.showTwoFactorForm = false;
        this.twoFactorForm.reset();
        this.isSubmitting = false;
    }
}