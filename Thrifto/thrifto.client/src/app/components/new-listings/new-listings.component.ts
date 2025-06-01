// src/app/components/new-listings/new-listings.component.ts
import {
    trigger,
    state,
    style,
    transition,
    animate
} from '@angular/animations';

import {
    Component,
    OnInit,
    OnDestroy,
    ChangeDetectionStrategy,
    ChangeDetectorRef
} from '@angular/core';

import { Router, ActivatedRoute } from '@angular/router';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ListingService } from '../../services/listing.service';
import { PaginationService } from '../../services/pagination.service';
import { Listing } from '../../models/listing.model';
import { PriceRange } from '../shared/price-range-filter/price-range-filter.component';

export type ViewMode = 'grid' | 'list' | 'magazine';
export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'popularity' | 'sustainability';

interface QualityOption {
    label: string;
    value: string;
    count?: number;
}

@Component({
    selector: 'app-new-listings',
    templateUrl: './new-listings.component.html',
    styleUrls: ['./new-listings.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('slideDown', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(-20px)' }),
                animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ]),
            transition(':leave', [
                animate('0.3s ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
            ])
        ])
    ]
})
export class NewListingsComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    private filterChange$ = new BehaviorSubject<any>(null);

    // Core data
    listings: Listing[] = [];
    isLoading = false;
    totalItemsCount = 1250;

    // View and display
    viewMode: ViewMode = 'grid';
    isCompactMode = false;

    // Filtering and sorting
    sortBy: SortOption = 'newest';
    selectedQuality = '';
    priceRange: PriceRange = { min: 0, max: 10000 };
    hoveredQuality = '';
    showFavoritesOnly = false;
    isPriceFilterExpanded = false;


    // Search and discovery
    popularTags = [
        'Vintage Denim', 'Designer Bags', 'Sustainable Cotton', 'Retro Style',
        'Bohemian', 'Minimalist', 'Vintage Leather', 'Eco-Friendly'
    ];

    alternativeSearches = [
        'Casual Wear', 'Formal Attire', 'Seasonal Items', 'Accessories',
        'Outerwear', 'Footwear', 'Jewelry', 'Designer Pieces'
    ];

    // Animation particles for hero
    sustainabilityParticles = [
        { icon: 'fas fa-leaf' },
        { icon: 'fas fa-recycle' },
        { icon: 'fas fa-heart' },
        { icon: 'fas fa-globe-americas' },
        { icon: 'fas fa-tree' }
    ];

    // Configuration data
    qualities: QualityOption[] = [
        { label: 'New', value: 'NEW', count: 245 },
        { label: 'Like New', value: 'LIKE NEW', count: 189 },
        { label: 'Barely Worn', value: 'BARELY WORN', count: 334 },
        { label: 'Used', value: 'USED', count: 456 }
    ];

    // Favorites simulation (would come from user service)
    private favoriteIds = new Set<number>();

    constructor(
        private listingService: ListingService,
        private router: Router,
        private route: ActivatedRoute,
        public paginationService: PaginationService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.initializeFilters();
        this.setupFilterFlow();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // ✅ FIXED: Price filter event handlers
    onPriceRangeChange(priceRange: PriceRange): void {
        console.log('💰 Price range changed:', priceRange); // Debug log
        this.priceRange = priceRange;
        this.resetPaginationAndFilter();
    }

    onPriceFilterReset(): void {
        console.log('🔄 Price filter reset'); // Debug log
        this.priceRange = { min: 0, max: 10000 };
        this.isPriceFilterExpanded = false; // Auto-close panel
        this.resetPaginationAndFilter();
    }

    // Magazine view methods
    getMagazineColumns(): Listing[][] {
        const columns: Listing[][] = [[], [], []]; // 3 columns

        this.listings.forEach((listing, index) => {
            const columnIndex = index % 3;
            columns[columnIndex].push(listing);
        });

        return columns;
    }

    getMagazineItemHeight(columnIndex: number, itemIndex: number): string {
        // Create varied heights for Pinterest-style layout
        const heights = ['240px', '320px', '280px', '360px', '200px', '300px'];
        const heightIndex = (columnIndex * 10 + itemIndex) % heights.length;
        return heights[heightIndex];
    }

    shouldShowDescription(columnIndex: number, itemIndex: number): boolean {
        // Show description on every 3rd item for variety
        return (columnIndex + itemIndex) % 3 === 0;
    }

    togglePriceFilter(): void {
        this.isPriceFilterExpanded = !this.isPriceFilterExpanded;
        this.cdr.detectChanges();
    }

    get hasActivePriceFilter(): boolean {
        return this.priceRange.min > 0 || this.priceRange.max < 10000;
    }

    // ✅ FIXED: Build API parameters with proper price filtering
    private buildApiParams(): any {
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

        // ✅ FIXED: Always include price range if it's not the default full range
        if (this.priceRange.min > 0) {
            params.minPrice = this.priceRange.min;
        }
        if (this.priceRange.max < 10000) {
            params.maxPrice = this.priceRange.max;
        }

        console.log('🔧 Built API Params:', params); // Debug log
        return params;
    }

    private initializeFilters(): void {
        // Initialize from query params
        this.route.queryParams.pipe(
            takeUntil(this.destroy$)
        ).subscribe(params => {
            this.selectedQuality = params['quality'] || '';
            this.sortBy = params['sort'] || 'newest';

            // ✅ FIXED: Initialize price range from URL
            if (params['minPrice']) {
                this.priceRange.min = parseInt(params['minPrice']);
            }
            if (params['maxPrice']) {
                this.priceRange.max = parseInt(params['maxPrice']);
            }

            // Reset pagination and trigger initial load
            this.paginationService.reset();
            this.listings = [];

            // Use setTimeout to ensure proper initialization
            setTimeout(() => {
                this.filterChange$.next(this.buildApiParams());
            }, 0);
        });
    }

    private setupFilterFlow(): void {
        // ✅ FIXED: Proper filter flow with switchMap to prevent race conditions
        this.filterChange$.pipe(
            takeUntil(this.destroy$),
            debounceTime(300),
            distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
            switchMap(params => {
                if (!params) return [];

                console.log('🚀 Making API call with params:', params); // Debug log
                this.isLoading = true;
                this.paginationService.setLoading(true);
                this.cdr.detectChanges();

                return this.listingService.getListings(params);
            })
        ).subscribe({
            next: (response) => {
                console.log('✅ API response received:', response); // Debug log

                if (this.paginationService.currentPage === 1) {
                    this.listings = response.items || [];
                } else {
                    this.listings = [...this.listings, ...(response.items || [])];
                }

                this.paginationService.setTotalCount(response.totalCount || 0);
                this.isLoading = false;
                this.paginationService.setLoading(false);
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('❌ Error loading listings:', error);
                this.handleLoadingError(error);
            }
        });
    }

    private handleLoadingError(error: any): void {
        this.isLoading = false;
        this.paginationService.setLoading(false);
        this.cdr.detectChanges();
    }

    // ✅ FIXED: Filter Management
    selectQuality(quality: string): void {
        this.selectedQuality = this.selectedQuality === quality ? '' : quality;
        this.resetPaginationAndFilter();
    }

    onSortChange(): void {
        console.log('📊 Sort changed to:', this.sortBy); // Debug log
        this.resetPaginationAndFilter();
        this.updateQueryParams();
    }

    clearQualityFilter(): void {
        this.selectedQuality = '';
        this.resetPaginationAndFilter();
    }

    clearAllFilters(): void {
        this.selectedQuality = '';
        this.priceRange = { min: 0, max: 10000 };
        this.sortBy = 'newest';
        this.showFavoritesOnly = false;
        this.resetPaginationAndFilter();
        this.updateQueryParams();
    }

    private resetPaginationAndFilter(): void {
        this.paginationService.reset();
        this.listings = [];
        this.filterChange$.next(this.buildApiParams());
    }

    private updateQueryParams(): void {
        const queryParams: any = {};

        if (this.selectedQuality) queryParams.quality = this.selectedQuality;
        if (this.sortBy !== 'newest') queryParams.sort = this.sortBy;
        if (this.priceRange.min > 0) queryParams.minPrice = this.priceRange.min;
        if (this.priceRange.max < 10000) queryParams.maxPrice = this.priceRange.max;

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: queryParams,
            replaceUrl: true
        });
    }

    // View Management
    setViewMode(mode: ViewMode): void {
        this.viewMode = mode;
        this.cdr.detectChanges();
    }

    toggleFavoritesOnly(): void {
        this.showFavoritesOnly = !this.showFavoritesOnly;
        // Would filter listings by favorites here
    }

    // Search and Discovery
    onSearch(query: string): void {
        this.router.navigate(['/search'], { queryParams: { q: query } });
    }

    searchByTag(tag: string): void {
        this.router.navigate(['/search'], { queryParams: { q: tag } });
    }

    shuffleResults(): void {
        if (this.listings.length > 0) {
            // Navigate to a random listing detail
            const randomIndex = Math.floor(Math.random() * this.listings.length);
            const randomListing = this.listings[randomIndex];
            this.viewListingDetails(randomListing.id);
        } else {
            // If no listings, load some and then pick random
            this.exploreRecommendations();
        }
    }

    exploreRecommendations(): void {
        this.clearAllFilters();
        this.sortBy = 'popularity';
        this.onSortChange();
    }

    exploreMoreCategories(): void {
        this.router.navigate(['/categories']);
    }

    // Item Interactions
    viewListingDetails(id: number): void {
        const listing = this.listings.find(l => l.id === id);
        if (listing) {
            this.router.navigate(['/listing', id], {
                state: { listing: listing }
            });
        } else {
            this.router.navigate(['/listing', id]);
        }
    }

    onListingHover(listing: Listing): void {
        // Could preload listing details or show preview
    }

    onListingLeave(): void {
        // Reset any hover states
    }

    toggleFavorite(id: number, event: Event): void {
        event.stopPropagation();
        if (this.favoriteIds.has(id)) {
            this.favoriteIds.delete(id);
        } else {
            this.favoriteIds.add(id);
        }
    }

    shareItem(listing: Listing, event: Event): void {
        event.stopPropagation();
        if (navigator.share) {
            navigator.share({
                title: listing.title,
                text: `Check out this ${listing.quality.toLowerCase()} ${listing.title.toLowerCase()}!`,
                url: window.location.origin + `/listing/${listing.id}`
            });
        }
    }

    // ✅ FIXED: Pagination
    onScroll(): void {
        if (!this.isLoading && this.paginationService.hasMoreItems) {
            this.paginationService.nextPage();
            this.filterChange$.next(this.buildApiParams());
        }
    }

    loadMoreManually(): void {
        if (!this.isLoading && this.paginationService.hasMoreItems) {
            this.paginationService.nextPage();
            this.filterChange$.next(this.buildApiParams());
        }
    }

    // Utility Methods
    trackByListingId(index: number, listing: Listing): number {
        return listing.id;
    }

    isFavorite(id: number): boolean {
        return this.favoriteIds.has(id);
    }

    getImageUrl(url: string | undefined): string {
        return url || 'assets/images/placeholder.png';
    }

    getTimeAgo(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return `${Math.floor(diffDays / 7)}w ago`;
    }

    getQualityClass(quality: string): string {
        return quality.toLowerCase().replace(/\s+/g, '-');
    }

    getQualityIcon(quality: string): string {
        const icons = {
            'NEW': 'fas fa-star',
            'LIKE NEW': 'fas fa-gem',
            'BARELY WORN': 'fas fa-heart',
            'USED': 'fas fa-leaf'
        };
        return icons[quality as keyof typeof icons] || 'fas fa-tag';
    }

    getQualityLabel(value: string): string {
        const quality = this.qualities.find(q => q.value === value);
        return quality ? quality.label : value;
    }

    getQualityCount(quality: string): number {
        const qualityOption = this.qualities.find(q => q.value === quality);
        return qualityOption ? qualityOption.count || 0 : 0;
    }

    getListingPreview(listing: Listing): string {
        if (listing.description && listing.description.length > 0) {
            return listing.description.substring(0, 120) + '...';
        }
        return `This ${listing.quality.toLowerCase()} ${listing.title.toLowerCase()} is ready for its next adventure.`;
    }

    getStoryExcerpt(listing: Listing): string {
        if (listing.description && listing.description.length > 0) {
            return listing.description.substring(0, 80) + '...';
        }
        return `A beautiful ${listing.quality.toLowerCase()} piece with character and style.`;
    }

    getResultsTitle(): string {
        if (this.hasActiveFilters) {
            return 'Filtered Discoveries';
        }
        return 'Latest Marketplace Treasures';
    }

    getActiveFiltersCount(): number {
        let count = 0;
        if (this.selectedQuality) count++;
        if (this.priceRange.min > 0 || this.priceRange.max < 10000) count++;
        if (this.sortBy !== 'newest') count++;
        return count;
    }

    calculateSustainabilityScore(): number {
        // Mock calculation based on filters and selections
        let score = 75; // Base sustainability score
        if (this.selectedQuality === 'USED') score += 15;
        if (this.selectedQuality === 'BARELY WORN') score += 10;
        return Math.min(score, 100);
    }

    get hasActiveFilters(): boolean {
        return this.getActiveFilters().length > 0;
    }

    getActiveFilters(): string[] {
        const filters: string[] = [];
        if (this.selectedQuality) filters.push(`Quality: ${this.getQualityLabel(this.selectedQuality)}`);
        if (this.priceRange.min > 0 || this.priceRange.max < 10000) {
            filters.push(`Price: $${this.priceRange.min} - $${this.priceRange.max}`);
        }
        if (this.sortBy !== 'newest') filters.push(`Sort: ${this.sortBy}`);
        return filters;
    }
}