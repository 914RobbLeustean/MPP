// src/app/components/listing-detail/listing-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ListingService } from '../../services/listing.service';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { Listing } from '../../models/listing.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-listing-detail',
  templateUrl: './listing-detail.component.html',
  styleUrls: ['./listing-detail.component.scss']
})
export class ListingDetailComponent implements OnInit {
  listing: Listing | null = null;
  selectedImage: string | null = null;
  isLoading = true;
  rawListingData: any = null; // Store the raw data for debugging

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private listingService: ListingService,
    private cartService: CartService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (!isNaN(id)) {
        this.loadListing(id);
      } else {
        this.router.navigate(['/']);
      }
    });
  }

  loadListing(id: number): void {
    this.isLoading = true;
    this.listingService.getListingById(id).subscribe({
      next: (response) => {
        // Store the raw data for debugging
        this.rawListingData = response;
        console.log('Raw API response:', response);

        // Process the listing data
        this.listing = response as Listing;

        // Inspect the description property
        if (this.listing) {
          console.log('Description property exists:', 'description' in this.listing);
          console.log('Description value:', this.listing.description);
          console.log('Description type:', typeof this.listing.description);
          if (typeof this.listing.description === 'string') {
            console.log('Description length:', this.listing.description.length);
            console.log('Description trimmed length:', this.listing.description.trim().length);
          }

          // Create a direct object property - fixes issues with getter-only properties
          if (!this.listing.description && response.description) {
            Object.defineProperty(this.listing, 'description', {
              value: response.description,
              writable: true,
              configurable: true,
              enumerable: true
            });
          }
        }

        if (this.listing?.photoUrls?.length) {
          this.selectedImage = this.listing.mainPhotoUrl || this.listing.photoUrls[0];
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading listing details', error);
        this.notificationService.show('Error loading listing details', 'error');
        this.isLoading = false;
        this.router.navigate(['/']);
      }
    });
  }

  // Enhanced description checking
  hasDescription(): boolean {
    if (!this.listing) return false;

    // Check for description in various ways to be thorough
    const standardDesc = this.listing.description;
    const rawDesc = this.rawListingData?.description;

    // Check if any of these exist and are not empty
    return Boolean(
      (typeof standardDesc === 'string' && standardDesc.trim().length > 0) ||
      (typeof rawDesc === 'string' && rawDesc.trim().length > 0)
    );
  }

  // Enhanced description getter
  getDescription(): string {
    if (!this.listing) return '';

    // Try to get the description from various sources
    if (typeof this.listing.description === 'string' && this.listing.description.trim().length > 0) {
      return this.listing.description;
    }

    if (this.rawListingData && typeof this.rawListingData.description === 'string' &&
      this.rawListingData.description.trim().length > 0) {
      return this.rawListingData.description;
    }

    return '';
  }

  // Add this method to properly resolve image URLs
  getImageUrl(url: string | null | undefined): string {
    if (!url) {
      return 'assets/images/placeholder.png';
    }

    // If the URL is relative (from your backend)
    if (url.startsWith('/')) {
      return `${environment.apiUrl.split('/api')[0]}${url}`;
    }

    return url;
  }

  selectImage(imageUrl: string): void {
    this.selectedImage = imageUrl;
  }

  addToCart(): void {
    if (this.listing) {
      this.cartService.addToCart(this.listing);
      this.notificationService.show(`${this.listing.title} added to cart`, 'success');
    }
  }

  contactSeller(): void {
    if (!this.listing) return;

    if (!this.authService.isLoggedIn()) {
      this.notificationService.show('Please login to contact the seller', 'info');
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.router.navigate(['/chat', this.listing.userId]);
  }
}
