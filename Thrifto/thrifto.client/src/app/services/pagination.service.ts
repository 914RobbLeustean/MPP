// src/app/services/pagination.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PaginationService {
    private pageSubject = new BehaviorSubject<number>(1);
    private pageSizeSubject = new BehaviorSubject<number>(12); // Match your existing page size
    private totalCountSubject = new BehaviorSubject<number>(0);
    private loadingSubject = new BehaviorSubject<boolean>(false);
    private hasMoreSubject = new BehaviorSubject<boolean>(true);

    constructor() { }

    get page$(): Observable<number> {
        return this.pageSubject.asObservable();
    }

    get pageSize$(): Observable<number> {
        return this.pageSizeSubject.asObservable();
    }

    get totalCount$(): Observable<number> {
        return this.totalCountSubject.asObservable();
    }

    get loading$(): Observable<boolean> {
        return this.loadingSubject.asObservable();
    }

    get hasMore$(): Observable<boolean> {
        return this.hasMoreSubject.asObservable();
    }

    get currentPage(): number {
        return this.pageSubject.value;
    }

    get currentPageSize(): number {
        return this.pageSizeSubject.value;
    }

    get totalCount(): number {
        return this.totalCountSubject.value;
    }

    get isLoading(): boolean {
        return this.loadingSubject.value;
    }

    get hasMoreItems(): boolean {
        return this.hasMoreSubject.value;
    }

    // ✅ ADD: Calculate remaining items
    get remainingItems(): number {
        const currentlyShown = this.currentPage * this.currentPageSize;
        const remaining = this.totalCount - currentlyShown;
        return Math.max(0, remaining);
    }

    // ✅ ADD: Calculate currently shown items
    get currentlyShownItems(): number {
        return Math.min(this.currentPage * this.currentPageSize, this.totalCount);
    }

    // ✅ ADD: Calculate percentage of items shown
    get progressPercentage(): number {
        if (this.totalCount === 0) return 0;
        return Math.round((this.currentlyShownItems / this.totalCount) * 100);
    }

    setPage(page: number): void {
        this.pageSubject.next(page);
    }

    setPageSize(pageSize: number): void {
        this.pageSizeSubject.next(pageSize);
    }

    setTotalCount(totalCount: number): void {
        this.totalCountSubject.next(totalCount);
        // Update has more based on total count
        this.updateHasMore();
    }

    setLoading(loading: boolean): void {
        this.loadingSubject.next(loading);
    }

    setHasMore(hasMore: boolean): void {
        this.hasMoreSubject.next(hasMore);
    }

    nextPage(): void {
        if (this.hasMoreItems && !this.isLoading) {
            this.setPage(this.currentPage + 1);
        }
    }

    reset(): void {
        this.setPage(1);
        this.setTotalCount(0);
        this.setLoading(false);
        this.setHasMore(true);
    }

    private updateHasMore(): void {
        // If we have a total count, check if there are more items
        if (this.totalCount > 0) {
            const hasMore = this.currentPage * this.currentPageSize < this.totalCount;
            this.setHasMore(hasMore);
        }
    }

    // ✅ ADD: Get pagination info summary
    getPaginationSummary(): string {
        if (this.totalCount === 0) return 'No items';

        const start = ((this.currentPage - 1) * this.currentPageSize) + 1;
        const end = Math.min(this.currentPage * this.currentPageSize, this.totalCount);

        return `Showing ${start}-${end} of ${this.totalCount} items`;
    }
}