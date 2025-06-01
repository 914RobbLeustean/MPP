// src/app/components/shared/search-bar/search-bar.component.ts
import {
    Component,
    EventEmitter,
    Input,
    Output,
    OnInit,
    OnChanges,
    OnDestroy,
    SimpleChanges,
    ViewChild,
    ElementRef,
    ChangeDetectionStrategy
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject, fromEvent } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

export type SearchBarTheme = 'teal' | 'blue' | 'green' | 'purple';
export type SearchBarSize = 'small' | 'medium' | 'large';

@Component({
    selector: 'app-search-bar',
    templateUrl: './search-bar.component.html',
    styleUrls: ['./search-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchBarComponent implements OnInit, OnChanges, OnDestroy {
    @ViewChild('searchInput', { static: true }) searchInputRef!: ElementRef<HTMLInputElement>;

    // Input properties
    @Input() initialValue = '';
    @Input() liveUpdate = false;
    @Input() placeholder = 'Search for items, brands, categories...';
    @Input() theme: SearchBarTheme = 'teal';
    @Input() size: SearchBarSize = 'medium';
    @Input() showSearchIcon = false;
    @Input() showClearButton = true;
    @Input() showButtonText = false;
    @Input() buttonText = 'Search';
    @Input() submitButtonAriaLabel = 'Search for items';
    @Input() isLoading = false;
    @Input() showSuggestions = false;
    @Input() searchSuggestions: string[] = [];
    @Input() suggestionsTitle = 'Popular searches';
    @Input() debounceTime = 300;
    @Input() navigateOnSubmit = true;

    // Output events
    @Output() searchQuery = new EventEmitter<string>();
    @Output() searchSubmit = new EventEmitter<string>();
    @Output() searchFocus = new EventEmitter<void>();
    @Output() searchBlur = new EventEmitter<void>();
    @Output() searchClear = new EventEmitter<void>();
    @Output() suggestionSelected = new EventEmitter<string>();

    // Component state
    searchTerm = '';
    isFocused = false;
    private destroy$ = new Subject<void>();

    constructor(private router: Router) { }

    ngOnInit(): void {
        this.searchTerm = this.initialValue || '';
        this.setupLiveSearch();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['initialValue'] && changes['initialValue'].currentValue !== undefined) {
            this.searchTerm = changes['initialValue'].currentValue || '';
        }

        if (changes['isLoading']) {
            // Handle loading state changes if needed
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private setupLiveSearch(): void {
        if (!this.liveUpdate) return;

        fromEvent(this.searchInputRef.nativeElement, 'input').pipe(
            takeUntil(this.destroy$),
            debounceTime(this.debounceTime),
            distinctUntilChanged()
        ).subscribe(() => {
            this.searchQuery.emit(this.searchTerm.trim());
        });
    }

    // Event handlers
    onSubmit(event: Event): void {
        event.preventDefault();

        const trimmedTerm = this.searchTerm.trim();
        if (!trimmedTerm) return;

        this.searchSubmit.emit(trimmedTerm);

        if (this.navigateOnSubmit) {
            this.router.navigate(['/search'], {
                queryParams: { q: trimmedTerm }
            });
        }

        // Blur the input after submit on mobile
        if (window.innerWidth <= 768) {
            this.searchInputRef.nativeElement.blur();
        }
    }

    onInput(): void {
        if (!this.liveUpdate) return;
        // Live updates are handled by the RxJS stream in setupLiveSearch
    }

    onFocus(): void {
        this.isFocused = true;
        this.searchFocus.emit();
    }

    onBlur(): void {
        // Delay blur to allow suggestion clicks
        setTimeout(() => {
            this.isFocused = false;
            this.searchBlur.emit();
        }, 150);
    }

    clearSearch(): void {
        this.searchTerm = '';
        this.searchClear.emit();
        this.searchInputRef.nativeElement.focus();

        if (this.liveUpdate) {
            this.searchQuery.emit('');
        }
    }

    selectSuggestion(suggestion: string): void {
        this.searchTerm = suggestion;
        this.suggestionSelected.emit(suggestion);

        if (this.navigateOnSubmit) {
            this.router.navigate(['/search'], {
                queryParams: { q: suggestion }
            });
        }

        this.isFocused = false;
    }

    // Public methods
    resetSearch(): void {
        this.searchTerm = '';
        this.isFocused = false;
    }

    focusInput(): void {
        this.searchInputRef.nativeElement.focus();
    }

    blurInput(): void {
        this.searchInputRef.nativeElement.blur();
    }

    // Utility methods
    trackBySuggestion(index: number, suggestion: string): string {
        return suggestion;
    }

    get themeClass(): string {
        const classes = [];

        if (this.theme !== 'teal') {
            classes.push(`theme-${this.theme}`);
        }

        if (this.size !== 'medium') {
            classes.push(`size-${this.size}`);
        }

        return classes.join(' ');
    }
}