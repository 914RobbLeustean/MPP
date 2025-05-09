// src/app/components/shared/listing-item/listing-item.component.ts
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Listing } from '../../../models/listing.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-listing-item',
  templateUrl: './listing-item.component.html',
  styleUrls: ['./listing-item.component.scss']
})
export class ListingItemComponent {
  @Input() listing!: Listing;

  constructor(private router: Router) { }

  viewDetails(): void {
    this.router.navigate(['/listing', this.listing.id]);
  }

  // Add this method to properly resolve image URLs
  getImageUrl(url: string | null | undefined): string {
    console.log('Original image URL:', url);

    if (!url) {
      console.log('Using placeholder due to null/undefined URL');
      return 'assets/images/placeholder.png';
    }

    // If the URL is relative (from your backend)
    if (url.startsWith('/')) {
      const baseUrl = environment.apiUrl.split('/api')[0];
      const fullUrl = `${baseUrl}${url}`;
      console.log('Converted relative URL to:', fullUrl);
      return fullUrl;
    }

    console.log('Using original URL:', url);
    return url;
  }
}
