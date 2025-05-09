// src/app/components/new-listings/new-listings.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ListingService } from '../../services/listing.service';
import { PaginationService } from '../../services/pagination.service';
import { Listing } from '../../models/listing.model';

@Component({
  selector: 'app-new-listings',
  templateUrl: './new-listings.component.html',
  styleUrls: ['./new-listings.component.scss']
})
export class NewListingsComponent implements OnInit, OnDestroy {
  listings: Listing[] = [];
  isLoading = false;

  // Filtering and sorting
  sortBy = 'newest';
  selectedQuality = '';

  private routeSubscription: Subscription | null = null;
  private pageSubscription: Subscription | null = null;

  qualities = [
    { label: 'New', value: 'NEW' },
    { label: 'Like New', value: 'LIKE NEW' },
    { label: 'Barely Worn', value: 'BARELY WORN' },
    { label: 'Used', value: 'USED' }
  ];

  constructor(
    private listingService: ListingService,
    private router: Router,
    private route: ActivatedRoute,
    public paginationService: PaginationService // Inject PaginationService and make it public to use in template
  ) { }

  ngOnInit(): void {
    // Reset pagination
    this.paginationService.reset();

    // Subscribe to query params changes
    this.routeSubscription = this.route.queryParams.subscribe(params => {
      // Reset listings when filters change
      this.listings = [];

      // Set filters from URL
      this.selectedQuality = params['quality'] || '';
      this.sortBy = params['sort'] || 'newest';

      // Reset pagination
      this.paginationService.reset();

      // Load first page
      this.loadListings();
    });

    // Subscribe to page changes for infinite scrolling
    this.pageSubscription = this.paginationService.page$.subscribe(page => {
      if (page > 1) { // Skip first page since it's already loaded by route subscription
        this.loadListings();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    if (this.pageSubscription) {
      this.pageSubscription.unsubscribe();
    }
  }

  loadListings(): void {
    // Skip if already loading
    if (this.isLoading) return;

    this.isLoading = true;
    this.paginationService.setLoading(true);

    // Prepare parameters
    const params: any = {
      page: this.paginationService.currentPage,
      pageSize: this.paginationService.currentPageSize
    };

    if (this.selectedQuality) {
      params.quality = this.selectedQuality;
    }

    if (this.sortBy !== 'newest') {
      params.sortBy = this.sortBy;
    }

    console.log('Loading listings with params:', params);

    this.listingService.getListings(params).subscribe({
      next: (response) => {
        // For first page, replace the array; for subsequent pages, append
        if (this.paginationService.currentPage === 1) {
          this.listings = response.items;
        } else {
          // Append new items to the existing array
          this.listings = [...this.listings, ...response.items];
        }

        // Update pagination info
        this.paginationService.setTotalCount(response.totalCount);
        console.log(`Total items: ${response.totalCount}, Current items: ${this.listings.length}`);

        this.isLoading = false;
        this.paginationService.setLoading(false);
      },
      error: (error) => {
        console.error('Error loading listings', error);
        this.isLoading = false;
        this.paginationService.setLoading(false);
      }
    });
  }

  onScroll(): void {
    // Load next page when user scrolls to bottom
    if (!this.isLoading && this.paginationService.hasMoreItems) {
      this.paginationService.nextPage();
    }
  }

  onSearch(query: string): void {
    this.router.navigate(['/search'], { queryParams: { q: query } });
  }

  onSortChange(): void {
    this.updateQueryParams();
  }

  onQualityChange(): void {
    this.updateQueryParams();
  }

  updateQueryParams(): void {
    // Create a clean object with only the necessary params
    const queryParams: any = {};

    // Only add quality if it's not empty (i.e., not "All")
    if (this.selectedQuality) {
      queryParams.quality = this.selectedQuality;
    }

    // Only add sort if it's not the default
    if (this.sortBy !== 'newest') {
      queryParams.sort = this.sortBy;
    }

    console.log('Updating with query params:', queryParams);

    // Use replaceUrl: true to ensure a clean navigation
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      replaceUrl: true // Replace the URL instead of merging params
    });
  }

  viewListingDetails(id: number): void {
    this.router.navigate(['/listing', id]);
  }

  clearFilters(): void {
    this.selectedQuality = '';
    this.sortBy = 'newest';
    this.updateQueryParams();
  }

  loadMoreManually(): void {
    console.log("Manual load more triggered");
    this.paginationService.nextPage();
  }
}
