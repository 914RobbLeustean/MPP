// src/app/components/search/search.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { takeUntil, tap, catchError, debounceTime, distinctUntilChanged, switchMap, startWith } from 'rxjs/operators';
import { ListingService } from '../../services/listing.service';
import { Listing } from '../../models/listing.model';
import { PriceRange } from '../shared/price-range-filter/price-range-filter.component';

export type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high';

@Component({
    selector: 'app-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    private searchQuery$ = new BehaviorSubject<string>('');
    private sortOption$ = new BehaviorSubject<SortOption>('newest');
    private priceRange$ = new BehaviorSubject<PriceRange>({ min: 0, max: 1000 });

    searchQuery = '';
    searchResults: Listing[] = [];
    allResults: Listing[] = []; // ✅ Store unfiltered results
    isLoading = false;
    errorMessage = '';
    sortOption: SortOption = 'newest';

    // ✅ Price filter properties
    priceFilter: PriceRange = { min: 0, max: 1000 };
    maxAvailablePrice = 1000;

    // Popular searches for the prompt section
    popularSearches = [
        'Vintage Denim', 'Designer Dresses', 'Leather Jackets',
        'Summer Tops', 'Sneakers', 'Handbags', 'Coats', 'Accessories'
    ];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private listingService: ListingService,
        private cdr: ChangeDetectorRef // ✅ Added for manual change detection
    ) { }

    ngOnInit(): void {
        this.initializeSearch();
        this.setupSearchFlow();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private initializeSearch(): void {
        // Listen to route query parameters
        this.route.queryParams.pipe(
            takeUntil(this.destroy$),
            tap(params => {
                const query = params['q'] || '';
                this.searchQuery = query;
                this.searchQuery$.next(query);

                // ✅ Initialize price filter from URL params if provided
                const minPrice = params['minPrice'] ? parseInt(params['minPrice']) : 0;
                const maxPrice = params['maxPrice'] ? parseInt(params['maxPrice']) : 1000;
                this.priceFilter = { min: minPrice, max: maxPrice };
                this.priceRange$.next(this.priceFilter);
            })
        ).subscribe();
    }

    private setupSearchFlow(): void {
        // ✅ Combine search query, sort option, and price range to trigger searches
        combineLatest([
            this.searchQuery$.pipe(distinctUntilChanged()),
            this.sortOption$.pipe(distinctUntilChanged()),
            this.priceRange$.pipe(distinctUntilChanged((prev, curr) =>
                prev.min === curr.min && prev.max === curr.max
            ))
        ]).pipe(
            takeUntil(this.destroy$),
            debounceTime(300),
            tap(() => this.isLoading = true),
            switchMap(([query, sort, priceRange]) => {
                if (!query.trim()) {
                    this.isLoading = false;
                    this.searchResults = [];
                    this.allResults = [];
                    return [];
                }
                return this.performSearch(query, sort, priceRange);
            })
        ).subscribe();
    }

    private performSearch(query: string, sort: SortOption, priceRange: PriceRange): Observable<Listing[]> {
        // ✅ Pass price range to the service
        return this.listingService.searchListings(query, priceRange).pipe(
            tap(results => {
                this.allResults = results;
                this.searchResults = this.sortResults(results, sort);
                this.updateMaxAvailablePrice(results);
                this.isLoading = false;
                this.errorMessage = '';
                this.cdr.detectChanges(); // ✅ Manual change detection
            }),
            catchError(error => {
                this.handleError('Failed to search listings', error);
                return [];
            })
        );
    }

    private sortResults(results: Listing[], sort: SortOption): Listing[] {
        const sortedResults = [...results];

        switch (sort) {
            case 'newest':
                return sortedResults.sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
            case 'oldest':
                return sortedResults.sort((a, b) =>
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
            case 'price-low':
                return sortedResults.sort((a, b) => a.price - b.price);
            case 'price-high':
                return sortedResults.sort((a, b) => b.price - a.price);
            default:
                return sortedResults;
        }
    }

    // ✅ Update max available price based on search results
    private updateMaxAvailablePrice(results: Listing[]): void {
        if (results.length > 0) {
            const maxPrice = Math.max(...results.map(r => r.price));
            this.maxAvailablePrice = Math.ceil(maxPrice / 50) * 50; // Round up to nearest 50
        }
    }

    private handleError(message: string, error: any): void {
        this.isLoading = false;
        this.errorMessage = message;
        console.error(message, error);
        this.cdr.detectChanges();
    }

    // Event handlers
    onSearchUpdate(query: string): void {
        if (query && query.trim()) {
            this.router.navigate(['/search'], {
                queryParams: {
                    q: query.trim(),
                    ...(this.priceFilter.min > 0 && { minPrice: this.priceFilter.min }),
                    ...(this.priceFilter.max < 1000 && { maxPrice: this.priceFilter.max })
                }
            });
        } else {
            this.clearSearch();
        }
    }

    onSortChange(): void {
        this.sortOption$.next(this.sortOption);
    }

    // ✅ Price filter event handlers
    onPriceRangeChange(priceRange: PriceRange): void {
        this.priceFilter = priceRange;
        this.priceRange$.next(priceRange);

        // Update URL with price parameters
        this.updateUrlWithFilters();
    }

    onPriceFilterReset(): void {
        this.priceFilter = { min: 0, max: this.maxAvailablePrice };
        this.priceRange$.next(this.priceFilter);
        this.updateUrlWithFilters();
    }

    private updateUrlWithFilters(): void {
        const queryParams: any = {};

        if (this.searchQuery) {
            queryParams.q = this.searchQuery;
        }

        if (this.priceFilter.min > 0) {
            queryParams.minPrice = this.priceFilter.min;
        }

        if (this.priceFilter.max < this.maxAvailablePrice) {
            queryParams.maxPrice = this.priceFilter.max;
        }

        this.router.navigate(['/search'], { queryParams });
    }

    clearSearch(): void {
        this.searchQuery = '';
        this.searchResults = [];
        this.allResults = [];
        this.errorMessage = '';
        this.priceFilter = { min: 0, max: 1000 };
        this.router.navigate(['/search'], { queryParams: {} });
    }

    searchPopular(term: string): void {
        this.router.navigate(['/search'], { queryParams: { q: term } });
    }

    exploreCategories(): void {
        this.router.navigate(['/categories']);
    }

    goToSell(): void {
        this.router.navigate(['/sell']);
    }

    viewListingDetails(id: number): void {
        this.router.navigate(['/listing', id]);
    }

    // Utility methods
    trackByListingId(index: number, listing: Listing): number {
        return listing.id;
    }

    calculateSavings(): number {
        // Estimate CO₂ savings - rough calculation
        // Assume each item saves approximately 8kg of CO₂
        return Math.round(this.searchResults.length * 8.2);
    }

    getAveragePrice(): number {
        if (this.searchResults.length === 0) return 0;

        const total = this.searchResults.reduce((sum, item) => sum + item.price, 0);
        return Math.round(total / this.searchResults.length);
    }
}