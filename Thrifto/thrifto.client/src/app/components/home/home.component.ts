// src/app/components/home/home.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Listing } from '../../models/listing.model';
import { ListingService } from '../../services/listing.service';
import { ViewportScroller } from '@angular/common';


@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    featuredListings: Listing[] = [];
    recentListings: Listing[] = [];
    heroFeaturedItem: Listing | null = null;
    isLoading = true;
    activeQuality = '';

    // ✅ ADD: Search-related properties for the search-bar component
    searchQuery = '';
    popularSearches = [
        'Vintage Denim',
        'Designer Dresses',
        'Leather Jackets',
        'Summer Tops',
        'Sneakers',
        'Handbags',
        'Coats',
        'Accessories',
        'Sustainable Fashion',
        'Pre-loved Luxury'
    ];

    // Dynamic search placeholders
    private searchPlaceholders = [
        'Vintage denim jacket...',
        'Designer handbag...',
        'Cozy sweater...',
        'Statement jewelry...',
        'Summer dress...'
    ];
    private currentPlaceholderIndex = 0;

    // Impact metrics for storytelling
    impactMetrics = [
        { icon: 'fas fa-recycle', value: '12.5K', label: 'Items Rescued' },
        { icon: 'fas fa-leaf', value: '89%', label: 'Waste Reduced' },
        { icon: 'fas fa-users', value: '3.2K', label: 'Happy Buyers' }
    ];

    qualities = [
        { label: 'New', value: 'NEW' },
        { label: 'Like New', value: 'LIKE NEW' },
        { label: 'Barely Worn', value: 'BARELY WORN' },
        { label: 'Used', value: 'USED' }
    ];

    constructor(
        private listingService: ListingService,
        private router: Router,
        private viewportScroller: ViewportScroller
    ) { }

    ngOnInit(): void {
        this.loadListings();
        this.startSearchPlaceholderRotation();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadListings(): void {
        // Load featured listings
        this.listingService.getListings({ pageSize: 20 }).subscribe({
            next: (response) => {
                if (response.items && response.items.length > 0) {
                    const shuffled = [...response.items];
                    for (let i = shuffled.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                    }
                    this.featuredListings = shuffled.slice(0, 6);
                    this.heroFeaturedItem = shuffled[0];
                }
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading featured listings', error);
                this.isLoading = false;
            }
        });

        // Load recent listings
        this.listingService.getNewListings(8).subscribe({
            next: (listings) => {
                this.recentListings = listings;
            },
            error: (error) => {
                console.error('Error loading recent listings', error);
            }
        });
    }

    private startSearchPlaceholderRotation(): void {
        interval(3000).pipe(
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.currentPlaceholderIndex =
                (this.currentPlaceholderIndex + 1) % this.searchPlaceholders.length;
        });
    }

    // ✅ ADD: Search-related methods for the search-bar component
    onSearchUpdate(query: string): void {
        this.searchQuery = query;
        // Optional: You could add live search preview functionality here
        // For example, showing search suggestions or live results
        console.log('Live search update:', query);
    }

    onSuggestionSelected(suggestion: string): void {
        this.searchQuery = suggestion;
        // Navigate to search page with the selected suggestion
        this.router.navigate(['/search'], { queryParams: { q: suggestion } });
    }

    // Helper methods for the template
    getSearchPlaceholder(): string {
        return this.searchPlaceholders[this.currentPlaceholderIndex];
    }

    getTotalItemsSaved(): number {
        return 12500 + this.featuredListings.length + this.recentListings.length;
    }

    getTotalListingsCount(): number {
        return 1250; // This could come from your API
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

    getQualityDescription(quality: string): string {
        const descriptions = {
            'NEW': 'Fresh from the wardrobe, tags still attached, waiting for their first adventure',
            'LIKE NEW': 'Barely worn treasures that look as good as the day they were bought',
            'BARELY WORN': 'Gently loved pieces with stories to tell and style to share',
            'USED': 'Well-loved classics with character, perfect for the conscious fashionista'
        };
        return descriptions[quality as keyof typeof descriptions] || '';
    }

    getQualityCount(quality: string): number {
        // This would normally come from your API
        const counts = { 'NEW': 245, 'LIKE NEW': 189, 'BARELY WORN': 334, 'USED': 456 };
        return counts[quality as keyof typeof counts] || 0;
    }

    getStoryExcerpt(listing: Listing): string {
        if (listing.description && listing.description.length > 0) {
            return listing.description.substring(0, 120) + '...';
        }
        return `This ${listing.quality.toLowerCase()} ${listing.title.toLowerCase()} is looking for someone who appreciates quality and sustainability...`;
    }

    getStreamItemClass(index: number): string {
        if (index === 0) return 'featured';
        return '';
    }

    // Interaction handlers
    viewListingDetails(id: number): void {
        const listing = this.featuredListings.find(l => l.id === id) ||
            this.recentListings.find(l => l.id === id) ||
            this.heroFeaturedItem;

        if (listing) {
            this.router.navigate(['/listing', id], {
                state: { listing: listing }
            });
        } else {
            this.router.navigate(['/listing', id]);
        }
    }

    onItemHover(listing: Listing): void {
        // Could add preview functionality here
    }

    onItemLeave(): void {
        // Reset any hover states
    }

    setActiveQuality(quality: string): void {
        this.router.navigate(['/new-listings'], {
            queryParams: { quality: quality }
        }).then(() => {
            // Use Angular's ViewportScroller for better control
            setTimeout(() => {
                this.viewportScroller.scrollToPosition([0, 300]);
            }, 100);
        });
    }

    // Add these methods for proper hover management
    onQualityHover(quality: string): void {
        // Only hover if not active
        if (this.activeQuality === '') {
            // Add CSS class via renderer or direct DOM manipulation if needed
        }
    }

    onQualityLeave(): void {
        // Clear hover state when leaving
    }

    // ✅ KEEP: Existing onSearch method (for backwards compatibility)
    onSearch(query: string): void {
        if (query) {
            this.router.navigate(['/search'], { queryParams: { q: query } });
        }
    }

    filterByQuality(quality: string): void {
        this.router.navigate(['/new-listings'], { queryParams: { quality } });
    }
}