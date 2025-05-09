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
  photos: (string | null)[] = [null, null, null, null]; // Four photo placeholders
  photoFiles: (File | null)[] = [null, null, null, null]; // Store the actual file objects
  showSuccessNotification = false;
  showFailedNotification = false;
  isSubmitting = false;

  highestPriceListing: number | null = null;
  lowestPriceListing: number | null = null;
  averagePriceListing: number | null = null;
  averagePrice: number = 0;

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

  // Add this method to fix the template error
  hasPhotoFiles(): boolean {
    return this.photoFiles.some(photo => photo !== null);
  }

  getImageUrl(url: string | null | undefined): string {
    if (!url) {
      return 'assets/images/placeholder.png';
    }

    // If the URL is relative (from your backend)
    if (url.startsWith('/')) {
      const baseUrl = environment.apiUrl.split('/api')[0];
      return `${baseUrl}${url}`;
    }

    return url;
  }

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

    //closest to avg.
    this.averagePriceListing = listings
      .reduce((closest, listing) => {
        return (Math.abs(listing.price - this.averagePrice) <
          Math.abs(closest.price - this.averagePrice))
          ? listing : closest;
      }, listings[0]).id;
  }

  //card style
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
      this.photoFiles[index] = file;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photos[index] = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.listingForm.valid && this.photoFiles.some(photo => photo !== null)) {
      this.isSubmitting = true;

      const formData = new FormData();

      // Append form values
      Object.keys(this.listingForm.controls).forEach(key => {
        formData.append(key, this.listingForm.get(key)!.value);
      });

      // Append photos
      this.photoFiles.forEach((file, index) => {
        if (file) {
          formData.append(`photos`, file);
        }
      });

      this.listingService.createListing(formData).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.showSuccessNotification = true;
          setTimeout(() => this.showSuccessNotification = false, 3000);
          this.resetForm();
          this.loadUserListings();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showFailedNotification = true;
          setTimeout(() => this.showFailedNotification = false, 3000);
          console.error('Error creating listing', error);
        }
      });
    } else {
      this.showFailedNotification = true;
      setTimeout(() => this.showFailedNotification = false, 3000);
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
    this.router.navigate(['/sell/edit', id]);
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
    if (this.listingToDelete !== null) {
      this.listingService.deleteListing(this.listingToDelete).subscribe({
        next: () => {
          this.showDeleteConfirmation = false;
          this.notificationService.show('Listing deleted successfully', 'success');
          this.loadUserListings();
        },
        error: (error) => {
          console.error('Error deleting listing', error);
          this.notificationService.show('Error deleting listing', 'error');
          this.showDeleteConfirmation = false;
        }
      });
    }
  }
}
