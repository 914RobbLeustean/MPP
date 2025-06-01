// src/app/components/listing-detail/listing-detail.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, tap, catchError } from 'rxjs/operators';
import { ListingService } from '../../services/listing.service';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { Listing } from '../../models/listing.model';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-listing-detail',
    templateUrl: './listing-detail.component.html',
    styleUrls: ['./listing-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListingDetailComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    listing: Listing | null = null;
    selectedImage: string | null = null;
    isLoading = false; // ✅ Start as false
    showDescription = false;
    errorMessage = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private listingService: ListingService,
        private cartService: CartService,
        private notificationService: NotificationService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef // ✅ Add ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        // ✅ Check for passed listing data first
        const navigation = this.router.getCurrentNavigation();
        const passedListing = navigation?.extras?.state?.['listing'] as Listing;

        this.route.params.pipe(
            takeUntil(this.destroy$)
        ).subscribe(params => {
            const id = +params['id'];
            if (!isNaN(id)) {
                if (passedListing && passedListing.id === id) {
                    // ✅ INSTANT DISPLAY - Use passed data immediately
                    this.displayListing(passedListing);
                    // ✅ Optionally refresh data in background (silent)
                    this.refreshListingInBackground(id);
                } else {
                    // ✅ No passed data - load normally but check cache first
                    this.loadListing(id);
                }
            } else {
                this.handleError('Invalid listing ID', null);
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    toggleDescription(): void {
        this.showDescription = !this.showDescription;
    }

    // ✅ Display listing immediately (no loading state)
    private displayListing(listing: Listing): void {
        this.listing = listing;
        if (listing?.photoUrls?.length) {
            this.selectedImage = listing.mainPhotoUrl || listing.photoUrls[0];
        }
        this.isLoading = false;
        this.cdr.detectChanges(); // ✅ Trigger change detection
    }

    // ✅ Silent background refresh (no loading indicators)
    private refreshListingInBackground(id: number): void {
        this.listingService.getListingById(id).pipe(
            takeUntil(this.destroy$),
            tap(refreshedListing => {
                // ✅ Only update if data actually changed
                if (JSON.stringify(refreshedListing) !== JSON.stringify(this.listing)) {
                    this.displayListing(refreshedListing);
                }
            }),
            catchError(error => {
                // ✅ Silent error handling - don't disrupt user experience
                console.warn('Background refresh failed:', error);
                return [];
            })
        ).subscribe();
    }

    getTimeAgo(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    }

    // ✅ Optimized loading with smart caching
    private loadListing(id: number): void {
        this.isLoading = true;
        this.cdr.detectChanges();

        this.listingService.getListingById(id).pipe(
            takeUntil(this.destroy$),
            tap(listing => {
                this.displayListing(listing);
            }),
            catchError(error => {
                this.handleError('Error loading listing details', error);
                return [];
            })
        ).subscribe();
    }

    private handleError(message: string, error: any): void {
        this.isLoading = false;
        this.errorMessage = message;
        this.notificationService.show(message, 'error');
        console.error(message, error);
        this.cdr.detectChanges();

        // Navigate to home after a delay
        setTimeout(() => {
            this.router.navigate(['/']);
        }, 3000);
    }

    getImageUrl(url: string | null | undefined): string {
        if (!url) {
            return 'assets/images/placeholder.png';
        }

        if (url.startsWith('/')) {
            return `${environment.apiUrl.split('/api')[0]}${url}`;
        }

        return url;
    }

    selectImage(imageUrl: string): void {
        this.selectedImage = imageUrl;
    }

    hasDescription(): boolean {
        return Boolean(
            this.listing?.description &&
            this.listing.description.trim().length > 0
        );
    }

    getDescription(): string {
        return this.listing?.description?.trim() || '';
    }

    getQualityClass(quality: string): string {
        return quality.toLowerCase().replace(/\s+/g, '-');
    }

    addToCart(): void {
        if (!this.listing) return;

        try {
            this.cartService.addToCart(this.listing);
            this.notificationService.show(
                `${this.listing.title} added to cart successfully!`,
                'success'
            );
        } catch (error) {
            this.notificationService.show(
                'Failed to add item to cart. Please try again.',
                'error'
            );
        }
    }

    contactSeller(): void {
        if (!this.listing) return;

        if (!this.authService.isLoggedIn()) {
            this.notificationService.show(
                'Please login to contact the seller',
                'info'
            );
            this.router.navigate(['/login'], {
                queryParams: { returnUrl: this.router.url }
            });
            return;
        }

        this.router.navigate(['/chat', this.listing.userId]);
    }

    openImageModal(): void {
        // TODO: Implement image modal/lightbox functionality
        this.notificationService.show('Image zoom feature coming soon!', 'info');
    }
}