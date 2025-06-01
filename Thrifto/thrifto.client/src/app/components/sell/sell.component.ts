// src/app/components/sell/sell.component.ts
import { environment } from '../../../environments/environment';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ListingService } from '../../services/listing.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { Listing } from '../../models/listing.model';

@Component({
    selector: 'app-sell',
    templateUrl: './sell.component.html',
    styleUrls: ['./sell.component.scss']
})
export class SellComponent implements OnInit {
    @ViewChild('fileInput') fileInput!: ElementRef;

    listingForm: FormGroup;
    photos: (string | null)[] = [null, null, null, null];
    photoFiles: (File | null)[] = [null, null, null, null];
    isSubmitting = false;

    highestPriceListing: number | null = null;
    lowestPriceListing: number | null = null;
    averagePriceListing: number | null = null;
    averagePrice: number = 0;

    userListings: Listing[] = [];
    isLoadingUserListings = true;

    showDeleteConfirmation = false;
    listingToDelete: number | null = null;

    constructor(
        private fb: FormBuilder,
        private listingService: ListingService,
        private authService: AuthService,
        private notificationService: NotificationService,
        private router: Router
    ) {
        this.listingForm = this.fb.group({
            title: ['', Validators.required],
            measurement: ['', Validators.required],
            quality: ['BARELY WORN', Validators.required],
            price: ['', [Validators.required, Validators.min(0.01)]],
            description: ['', [Validators.maxLength(250)]]
        });
    }

    ngOnInit(): void {
        this.loadUserListings();
    }

    // Getters
    get highestPrice(): number | null {
        const listing = this.userListings.find(l => l.id === this.highestPriceListing);
        return listing ? listing.price : null;
    }

    get lowestPrice(): number | null {
        const listing = this.userListings.find(l => l.id === this.lowestPriceListing);
        return listing ? listing.price : null;
    }

    get formattedAveragePrice(): string {
        return this.averagePrice?.toFixed(2) ?? '0.00';
    }

    get descriptionLength(): number {
        return this.listingForm.get('description')?.value?.length || 0;
    }

    // Photo management
    hasPhotoFiles(): boolean {
        return this.photoFiles.some(photo => photo !== null);
    }

    triggerFileInput(index: number): void {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = (event: any) => {
            this.onFileSelected(event, index);
        };
        fileInput.click();
    }

    onFileSelected(event: any, index: number): void {
        const file = event.target.files[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.notificationService.show('Image must be smaller than 5MB', 'error');
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.notificationService.show('Please select a valid image file', 'error');
                return;
            }

            this.photoFiles[index] = file;

            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.photos[index] = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    removePhoto(index: number): void {
        this.photos[index] = null;
        this.photoFiles[index] = null;
    }

    // Utility methods
    getImageUrl(url: string | null | undefined): string {
        if (!url) {
            return 'assets/images/placeholder.png';
        }

        if (url.startsWith('/')) {
            const baseUrl = environment.apiUrl.split('/api')[0];
            return `${baseUrl}${url}`;
        }

        return url;
    }

    formatDate(dateInput: Date | string): string {
        const date = new Date(dateInput);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        return `${Math.ceil(diffDays / 30)} months ago`;
    }


    scrollToForm(): void {
        document.querySelector('.create-listing-card')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    // Listing management
    loadUserListings(): void {
        const userId = this.authService.getCurrentUserId();
        if (userId) {
            this.isLoadingUserListings = true;
            this.listingService.getUserListings(userId).subscribe({
                next: (listings) => {
                    this.userListings = listings;
                    this.calculateListingStatistics(listings);
                    this.isLoadingUserListings = false;
                },
                error: (error) => {
                    console.error('Error loading user listings', error);
                    this.notificationService.show('Failed to load your listings', 'error');
                    this.isLoadingUserListings = false;
                }
            });
        }
    }

    calculateListingStatistics(listings: Listing[]): void {
        if (!listings || listings.length === 0) {
            return;
        }

        const highestPrice = Math.max(...listings.map(l => l.price));
        this.highestPriceListing = listings.find(l => l.price === highestPrice)?.id || null;

        const lowestPrice = Math.min(...listings.map(l => l.price));
        this.lowestPriceListing = listings.find(l => l.price === lowestPrice)?.id || null;

        this.averagePrice = listings.reduce((sum, listing) => sum + listing.price, 0) / listings.length;

        // FIXED: Corrected the reduce function syntax
        this.averagePriceListing = listings
            .reduce((closest, listing) => {
                return (Math.abs(listing.price - this.averagePrice) <
                    Math.abs(closest.price - this.averagePrice))
                    ? listing : closest;
            }, listings[0]).id;
    }

    getListingCardClass(listingId: number): string {
        if (listingId === this.highestPriceListing) {
            return 'highest-price';
        } else if (listingId === this.lowestPriceListing) {
            return 'lowest-price';
        } else if (listingId === this.averagePriceListing) {
            return 'average-price';
        }
        return '';
    }

    getListingBadge(listingId: number): string | null {
        if (listingId === this.highestPriceListing) {
            return 'Highest';
        } else if (listingId === this.lowestPriceListing) {
            return 'Lowest';
        } else if (listingId === this.averagePriceListing) {
            return 'Average';
        }
        return null;
    }

    getListingBadgeIcon(listingId: number): string {
        if (listingId === this.highestPriceListing) {
            return 'fa-arrow-up';
        } else if (listingId === this.lowestPriceListing) {
            return 'fa-arrow-down';
        } else if (listingId === this.averagePriceListing) {
            return 'fa-minus';
        }
        return '';
    }

    // Form actions
    onSubmit(): void {
        // FIXED: Added proper spacing after 'if'
        if (this.listingForm.valid && this.hasPhotoFiles()) {
            this.isSubmitting = true;

            const formData = new FormData();

            // Append form values
            Object.keys(this.listingForm.controls).forEach(key => {
                const value = this.listingForm.get(key)!.value;
                if (value !== null && value !== undefined && value !== '') {
                    formData.append(key, value);
                }
            });

            // Append photos
            this.photoFiles.forEach((file) => {
                if (file) {
                    formData.append('photos', file);
                }
            });

            this.listingService.createListing(formData).subscribe({
                next: (response) => {
                    this.isSubmitting = false;
                    this.notificationService.show('Listing published successfully!', 'success');
                    this.resetForm();
                    this.loadUserListings();
                },
                error: (error) => {
                    this.isSubmitting = false;
                    console.error('Error creating listing', error);
                    this.notificationService.show('Failed to publish listing. Please try again.', 'error');
                }
            });
        } else {
            this.listingForm.markAllAsTouched();
            if (!this.hasPhotoFiles()) {
                this.notificationService.show('Please add at least one photo', 'error');
            } else {
                this.notificationService.show('Please fill in all required fields', 'error');
            }
        }
    }

    resetForm(): void {
        this.listingForm.reset({
            quality: 'BARELY WORN'
        });
        this.photos = [null, null, null, null];
        this.photoFiles = [null, null, null, null];
    }

    editListing(id: number): void {
        this.router.navigate(['/edit-listing', id]);
    }

    deleteListing(id: number): void {
        this.listingToDelete = id;
        this.showDeleteConfirmation = true;
    }

    cancelDelete(): void {
        this.showDeleteConfirmation = false;
        this.listingToDelete = null;
    }

    confirmDelete(): void {
        // FIXED: Added proper spacing after 'if'
        if (this.listingToDelete !== null) {
            this.listingService.deleteListing(this.listingToDelete).subscribe({
                next: () => {
                    this.showDeleteConfirmation = false;
                    this.listingToDelete = null;
                    this.notificationService.show('Listing deleted successfully', 'success');
                    this.loadUserListings();
                },
                error: (error) => {
                    console.error('Error deleting listing', error);
                    this.notificationService.show('Failed to delete listing', 'error');
                    this.showDeleteConfirmation = false;
                    this.listingToDelete = null;
                }
            });
        }
    }
}