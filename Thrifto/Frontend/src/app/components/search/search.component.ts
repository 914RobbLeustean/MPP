// src/app/components/search/search.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ListingService } from '../../services/listing.service';
import { Listing } from '../../models/listing.model';
import { SearchBarComponent } from '../../components/shared/search-bar/search-bar.component';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  @ViewChild(SearchBarComponent) searchBarComponent!: SearchBarComponent;

  searchQuery: string = '';
  searchResults: Listing[] = [];
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private listingService: ListingService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['q']) {
        this.searchQuery = params['q'];
        this.performSearch();
      } else {
        this.searchQuery = '';
        this.searchResults = [];
        this.isLoading = false;
      }
    });
  }

  performSearch(): void {
    this.isLoading = true;
    this.listingService.searchListings(this.searchQuery).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error performing search:', error);
        this.isLoading = false;
      }
    });
  }

  onSearchUpdate(query: string): void {
    // Navigate with the search query as a parameter
    if (query && query.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: query } });
    } else {
      this.clearSearch();
    }
  }

  clearSearch(): void {
    // Reset search state
    this.searchQuery = '';
    this.searchResults = [];

    // Navigate to clear the URL parameters
    this.router.navigate(['/search'], { queryParams: {} }).then(() => {
      // If searchBarComponent is available after view is initialized
      if (this.searchBarComponent) {
        // Reset the search bar directly using the component reference
        this.searchBarComponent.resetSearch();
      }
    });
  }

  viewListingDetails(id: number): void {
    this.router.navigate(['/listing', id]);
  }
}
