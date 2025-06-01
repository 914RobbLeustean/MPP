// src/app/components/shared/price-range-filter/price-range-filter.component.ts
import {
    Component,
    Input,
    Output,
    EventEmitter,
    OnInit,
    OnChanges,
    SimpleChanges,
    ChangeDetectionStrategy
} from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

export interface PriceRange {
    min: number;
    max: number;
}

export interface PricePreset {
    label: string;
    min: number;
    max: number;
}

export type PriceFilterTheme = 'teal' | 'blue' | 'green' | 'purple';

@Component({
    selector: 'app-price-range-filter',
    templateUrl: './price-range-filter.component.html',
    styleUrls: ['./price-range-filter.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PriceRangeFilterComponent implements OnInit, OnChanges {
    private destroy$ = new Subject<void>();
    private priceChange$ = new Subject<PriceRange>();

    @Input() initialMin = 0;
    @Input() initialMax = 1000;
    @Input() absoluteMin = 0;
    @Input() absoluteMax = 1000;
    @Input() step = 1;
    @Input() theme: PriceFilterTheme = 'teal';
    @Input() showPresets = true;
    @Input() debounceTime = 300;

    @Output() priceRangeChange = new EventEmitter<PriceRange>();
    @Output() filterReset = new EventEmitter<void>();

    minPrice = 0;
    maxPrice = 1000;

    pricePresets: PricePreset[] = [
        { label: 'Budget', min: 0, max: 25 },
        { label: 'Value', min: 25, max: 75 },
        { label: 'Mid', min: 75, max: 150 },
        { label: 'Premium', min: 150, max: 500 },
        { label: 'Luxury', min: 500, max: 1000 }
    ];

    constructor() { }

    ngOnInit(): void {
        this.initializePrices();
        this.setupPriceChangeStream();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['initialMin'] || changes['initialMax']) {
            this.initializePrices();
        }

        if (changes['absoluteMax']) {
            this.updatePresets();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private initializePrices(): void {
        this.minPrice = this.initialMin;
        this.maxPrice = this.initialMax;
    }

    private setupPriceChangeStream(): void {
        this.priceChange$.pipe(
            takeUntil(this.destroy$),
            debounceTime(this.debounceTime),
            distinctUntilChanged((prev, curr) =>
                prev.min === curr.min && prev.max === curr.max
            )
        ).subscribe(range => {
            this.priceRangeChange.emit(range);
        });
    }

    private updatePresets(): void {
        const max = this.absoluteMax;
        this.pricePresets = [
            { label: 'Budget', min: 0, max: Math.round(max * 0.1) },
            { label: 'Value', min: Math.round(max * 0.1), max: Math.round(max * 0.3) },
            { label: 'Mid', min: Math.round(max * 0.3), max: Math.round(max * 0.5) },
            { label: 'Premium', min: Math.round(max * 0.5), max: Math.round(max * 0.8) },
            { label: 'Luxury', min: Math.round(max * 0.8), max: max }
        ];
    }

    // Event handlers
    onMinPriceChange(): void {
        this.validateMinPrice();
        this.emitPriceChange();
    }

    onMaxPriceChange(): void {
        this.validateMaxPrice();
        this.emitPriceChange();
    }

    onMinSliderChange(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.minPrice = parseInt(target.value);
        this.validateMinPrice();
        this.emitPriceChange();
    }

    onMaxSliderChange(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.maxPrice = parseInt(target.value);
        this.validateMaxPrice();
        this.emitPriceChange();
    }

    private validateMinPrice(): void {
        if (this.minPrice < this.absoluteMin) {
            this.minPrice = this.absoluteMin;
        }
        if (this.minPrice > this.maxPrice) {
            this.minPrice = this.maxPrice;
        }
    }

    private validateMaxPrice(): void {
        if (this.maxPrice > this.absoluteMax) {
            this.maxPrice = this.absoluteMax;
        }
        if (this.maxPrice < this.minPrice) {
            this.maxPrice = this.minPrice;
        }
    }

    validateAndEmit(): void {
        this.validateMinPrice();
        this.validateMaxPrice();
        this.emitPriceChange();
    }

    private emitPriceChange(): void {
        this.priceChange$.next({
            min: this.minPrice,
            max: this.maxPrice
        });
    }

    resetFilter(): void {
        this.minPrice = this.absoluteMin;
        this.maxPrice = this.absoluteMax;
        this.filterReset.emit();
        this.emitPriceChange();
    }

    applyPreset(preset: PricePreset): void {
        this.minPrice = preset.min;
        this.maxPrice = preset.max;
        this.emitPriceChange();
    }

    // Utility methods
    get hasActiveFilter(): boolean {
        return this.minPrice !== this.absoluteMin || this.maxPrice !== this.absoluteMax;
    }

    get themeClass(): string {
        return this.theme !== 'teal' ? `theme-${this.theme}` : '';
    }

    getSliderPosition(value: number): number {
        const range = this.absoluteMax - this.absoluteMin;
        return ((value - this.absoluteMin) / range) * 100;
    }

    getSliderWidth(): number {
        const range = this.absoluteMax - this.absoluteMin;
        return ((this.maxPrice - this.minPrice) / range) * 100;
    }

    isPresetActive(preset: PricePreset): boolean {
        return this.minPrice === preset.min && this.maxPrice === preset.max;
    }

    getFilterSummary(): string {
        if (this.minPrice === this.absoluteMin && this.maxPrice === this.absoluteMax) {
            return 'All prices';
        }

        if (this.minPrice === this.absoluteMin) {
            return `Up to $${this.maxPrice}`;
        }

        if (this.maxPrice === this.absoluteMax) {
            return `From $${this.minPrice}`;
        }

        return `$${this.minPrice} - $${this.maxPrice}`;
    }
}