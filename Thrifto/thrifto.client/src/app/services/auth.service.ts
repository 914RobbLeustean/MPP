// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { User } from '../models/user.model';
import {
    TwoFactorSetupDto,
    EnableTwoFactorDto,
    TwoFactorLoginDto,
    LoginResponse,
    TwoFactorStatusResponse
} from '../models/two-factor.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load user from localStorage on startup
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

    login(email: string, password: string): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
            .pipe(
                tap(response => {
                    // Only store user if login is complete (no 2FA required)
                    if (!response.requiresTwoFactor && response.token) {
                        const user: User = {
                            id: response.id!,
                            username: response.username!,
                            email: response.email!,
                            firstName: response.firstName!,
                            lastName: response.lastName!,
                            token: response.token
                        };
                        localStorage.setItem('currentUser', JSON.stringify(user));
                        this.currentUserSubject.next(user);
                    }
                })
            );
    }

    verifyTwoFactor(twoFactorData: TwoFactorLoginDto): Observable<User> {
        return this.http.post<User>(`${this.apiUrl}/2fa/verify`, twoFactorData)
            .pipe(
                tap(user => {
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    this.currentUserSubject.next(user);
                })
            );
    }

    register(user: any): Observable<User> {
        return this.http.post<User>(`${this.apiUrl}/register`, user);
    }

    logout(): void {
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
    }

    // 2FA Management Methods
    setup2FA(): Observable<TwoFactorSetupDto> {
        return this.http.get<TwoFactorSetupDto>(`${this.apiUrl}/2fa/setup`);
    }

    enable2FA(code: string): Observable<TwoFactorSetupDto> {
        const enableDto: EnableTwoFactorDto = { code };
        return this.http.post<TwoFactorSetupDto>(`${this.apiUrl}/2fa/enable`, enableDto);
    }

    disable2FA(): Observable<any> {
        return this.http.post(`${this.apiUrl}/2fa/disable`, {});
    }

    get2FAStatus(): Observable<TwoFactorStatusResponse> {
        return this.http.get<TwoFactorStatusResponse>(`${this.apiUrl}/2fa/status`);
    }

    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    isLoggedIn(): boolean {
        return !!this.currentUserSubject.value;
    }

    getCurrentUserId(): string | null {
        return this.currentUserSubject.value?.id || null;
    }

    getToken(): string | null {
        return this.currentUserSubject.value?.token || null;
    }
}
