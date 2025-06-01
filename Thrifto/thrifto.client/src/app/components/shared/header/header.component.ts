// src/app/components/shared/header/header.component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { User } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';
import { CartService } from '../../../services/cart.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
    currentUser$: Observable<User | null>;
    cartItemCount: number = 0;
    isDropdownOpen = false;
    isMobileMenuOpen = false;

    constructor(
        private authService: AuthService,
        private cartService: CartService,
        private router: Router
    ) {
        this.currentUser$ = this.authService.currentUser$;
    }

    ngOnInit(): void {
        this.cartService.cartItems$.subscribe(items => {
            this.cartItemCount = this.cartService.getItemCount();
        });
    }

    logout(): void {
        this.authService.logout();
        this.closeDropdown();
        this.closeMobileMenu();
        this.router.navigate(['/']);
    }

    toggleDropdown(): void {
        this.isDropdownOpen = !this.isDropdownOpen;
    }

    closeDropdown(): void {
        this.isDropdownOpen = false;
    }

    toggleMobileMenu(): void {
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
    }

    closeMobileMenu(): void {
        this.isMobileMenuOpen = false;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: Event): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.user-dropdown')) {
            this.closeDropdown();
        }
        if (!target.closest('.mobile-menu-toggle') && !target.closest('.mobile-menu')) {
            this.closeMobileMenu();
        }
    }

    @HostListener('window:resize', ['$event'])
    onResize(): void {
        if (window.innerWidth > 768) {
            this.closeMobileMenu();
        }
    }
}