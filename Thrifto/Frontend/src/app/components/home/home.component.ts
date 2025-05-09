// src/app/components/home/home.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Listing } from '../../models/listing.model';
import { ListingService } from '../../services/listing.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  featuredListings: Listing[] = [];
  recentListings: Listing[] = [];
  isLoading = true;

  qualities = [
    { label: 'New', value: 'NEW' },
    { label: 'Like New', value: 'LIKE NEW' },
    { label: 'Barely Worn', value: 'BARELY WORN' },
    { label: 'Used', value: 'USED' }
  ];

  constructor(
    private listingService: ListingService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadListings();
  }

  loadListings(): void {
    // First, fetch more listings to have a bigger pool for random selection
    this.listingService.getListings({ pageSize: 20 }).subscribe({
      next: (response) => {
        // Randomly select 4 unique listings
        if (response.items && response.items.length > 0) {
          // Shuffle the array using Fisher-Yates algorithm
          const shuffled = [...response.items];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          // Take the first 4 (or fewer if not enough listings)
          this.featuredListings = shuffled.slice(0, 4);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading featured listings', error);
        this.isLoading = false;
      }
    });

    // Load only 8 newest listings
    this.listingService.getNewListings(8).subscribe({
      next: (listings) => {
        // Use listings directly as it's still returning Listing[] and not a paginated response
        this.recentListings = listings;
      },
      error: (error) => {
        console.error('Error loading recent listings', error);
      }
    });
  }

  onSearch(query: string): void {
    // Do nothing here - navigation will happen from search-bar component
    // when the form is submitted
  }

  filterByQuality(quality: string): void {
    this.router.navigate(['/new-listings'], { queryParams: { quality } });
  }
}
