// src/app/components/edit-listing/edit-listing.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ListingService } from '../../services/listing.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { Listing } from '../../models/listing.model';
import { environment } from '../../../environments/environment';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-edit-listing',
  templateUrl: './edit-listing.component.html',
  styleUrls: ['./edit-listing.component.scss']
})
export class EditListingComponent implements OnInit {
  listingId!: number;
  listing: Listing | null = null;
  listingForm!: FormGroup;
  photos: (string | null)[] = [null, null, null, null]; // Four photo placeholders
  photoFiles: (File | null)[] = [null, null, null, null]; // Store the actual file objects
  showSuccessNotification = false;
  showFailedNotification = false;
  isSubmitting = false;
  isLoading = true;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private listingService: ListingService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    // Initialize the form here
    this.initForm();
  }

  // Initialize form separately to avoid null issues
  initForm(): void {
    this.listingForm = this.fb.group({
      title: ['', Validators.required],
      measurement: ['', Validators.required],
      quality: ['NEW', Validators.required],
      price: ['', [Validators.required, Validators.min(0.01)]],
      description: ['', [Validators.maxLength(250)]], // Added description field with validation
      deleteExistingPhotos: [false]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.listingId = +params['id'];
      if (!isNaN(this.listingId)) {
        this.loadListing();
      } else {
        this.router.navigate(['/sell']);
      }
    });
  }

  loadListing(): void {
    this.isLoading = true;

    this.listingService.getListingById(this.listingId).subscribe({
      next: (listing) => {
        this.listing = listing;
        console.log('Loaded listing for editing:', listing);

        // Check if the current user is the owner
        if (listing.userId !== this.authService.getCurrentUserId()) {
          this.notificationService.show('You do not have permission to edit this listing', 'error');
          this.router.navigate(['/sell']);
          return;
        }

        // Populate the form with safer null checks
        this.listingForm.patchValue({
          title: listing.title || '',
          measurement: listing.measurement || '',
          quality: listing.quality || 'NEW',
          price: listing.price || '',
          description: listing.description || '' // Make sure description is initialized
        });

        console.log('Form values after patch:', this.listingForm.value);

        // Populate photo previews
        if (listing.photoUrls?.length) {
          listing.photoUrls.forEach((url, index) => {
            if (index < 4) {
              this.photos[index] = this.getImageUrl(url);
            }
          });
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading listing', error);
        this.notificationService.show('Error loading listing details', 'error');
        this.isLoading = false;
        this.router.navigate(['/sell']);
      }
    });
  }

  getImageUrl(url: string): string {
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

    getCharacterCount(): number {
        return this.listingForm.get('description')?.value?.length || 0;
    }

    getPhotoCount(): number {
        return this.photos.filter(photo => photo !== null).length;
    }

    isEssentialComplete(): boolean {
        const title = this.listingForm.get('title')?.valid;
        const price = this.listingForm.get('price')?.valid;
        const measurement = this.listingForm.get('measurement')?.valid;
        return !!(title && price && measurement);
    }

    hasBasicInfo(): boolean {
        return this.isEssentialComplete() && this.getPhotoCount() > 0;
    }

    getSaveStatusClass(): string {
        if (this.isSubmitting) return 'saving';
        if (this.showSuccessNotification) return 'saved';
        if (this.showFailedNotification) return 'error';
        return '';
    }

    getSaveStatusIcon(): string {
        if (this.isSubmitting) return 'fa-spinner fa-spin';
        if (this.showSuccessNotification) return 'fa-check';
        if (this.showFailedNotification) return 'fa-exclamation-triangle';
        return 'fa-clock';
    }

    get saveStatusMessage(): string {
        if (this.isSubmitting) return 'Saving changes...';
        if (this.showSuccessNotification) return 'All changes saved';
        if (this.showFailedNotification) return 'Save failed';
        return 'Auto-save enabled';
    }

    getPreviewImage(): string {
        return this.photos[0] || 'assets/images/placeholder.png';
    }

    suggestDescription(): void {
        this.notificationService.show('Description suggestions coming soon!', 'info');
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
    }

    onDrop(event: DragEvent, index: number): void {
        event.preventDefault();
        event.stopPropagation();

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.handleFileSelection(files[0], index);
        }
    }

    removePhoto(index: number, event: Event): void {
        event.stopPropagation();
        this.photos[index] = null;
        this.photoFiles[index] = null;
    }

    private handleFileSelection(file: File, index: number): void {
        if (file && file.type.startsWith('image/')) {
            this.photoFiles[index] = file;

            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.photos[index] = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

  onSubmit(): void {
    if (this.listingForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';

      try {
        const formData = new FormData();

        // Get all form values from the form
        const formValues = this.listingForm.value;
        console.log('Original form values:', formValues);

        // Append form values - using lowercase to match model binding
        formData.append('title', formValues.title || '');
        formData.append('measurement', formValues.measurement || '');
        formData.append('quality', formValues.quality || '');
        formData.append('price', (formValues.price || 0).toString());

        // Handle description field - ensure it's never null
        const description = formValues.description !== null && formValues.description !== undefined
          ? formValues.description
          : '';
        formData.append('description', description);

        // Handle delete existing photos flag
        formData.append('deleteExistingPhotos', formValues.deleteExistingPhotos ? 'true' : 'false');

        // Add new photos if any
        let hasNewPhotos = false;
        this.photoFiles.forEach(file => {
          if (file) {
            formData.append('photos', file);
            hasNewPhotos = true;
          }
        });

        // Debug the form data
        console.log('Submitting update with new photos:', hasNewPhotos);

        this.listingService.updateListing(this.listingId, formData).subscribe({
          next: (response) => {
            this.isSubmitting = false;
            this.showSuccessNotification = true;
            this.notificationService.show('Listing updated successfully!', 'success');
            setTimeout(() => {
              this.showSuccessNotification = false;
              this.router.navigate(['/listing', this.listingId]);
            }, 2000);
          },
          error: (error: HttpErrorResponse) => {
            this.isSubmitting = false;
            this.showFailedNotification = true;

            // Attempt to extract a more detailed error message
            if (error.error) {
              if (typeof error.error === 'string') {
                this.errorMessage = error.error;
              } else if (error.error.errors) {
                this.errorMessage = 'Validation errors: ';
                for (const key in error.error.errors) {
                  if (error.error.errors.hasOwnProperty(key)) {
                    this.errorMessage += `${key}: ${error.error.errors[key].join(', ')}; `;
                  }
                }
              } else if (error.error.message) {
                this.errorMessage = error.error.message;
              }
            }

            console.error('Error updating listing', error);
            this.notificationService.show(`Error updating listing: ${this.errorMessage || 'Unknown error'}`, 'error');

            setTimeout(() => this.showFailedNotification = false, 3000);
          }
        });
      } catch (err) {
        this.isSubmitting = false;
        this.showFailedNotification = true;
        console.error('Exception while preparing form data:', err);
        this.notificationService.show('Error preparing form data', 'error');
        setTimeout(() => this.showFailedNotification = false, 3000);
      }
    } else {
      // Form is invalid - highlight the errors
      Object.keys(this.listingForm.controls).forEach(key => {
        const control = this.listingForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      this.notificationService.show('Please fix the form errors before submitting', 'error');
    }
  }

  cancel(): void {
    this.router.navigate(['/listing', this.listingId]);
  }
}
