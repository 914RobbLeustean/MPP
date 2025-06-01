// src/app/components/cart/cart.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../../services/cart.service';
import { NotificationService } from '../../services/notification.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-cart',
    templateUrl: './cart.component.html',
    styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
    cartItems: CartItem[] = [];
    showClearConfirmation = false;

    constructor(
        private cartService: CartService,
        private notificationService: NotificationService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.cartService.cartItems$.subscribe(items => {
            this.cartItems = items;
        });
    }

    // Utility methods
    getImageUrl(url: string | null | undefined): string {
        if (!url) {
            return 'assets/images/placeholder.png';
        }
        if (url.startsWith('/')) {
            const baseUrl = environment.apiUrl.split('/api')[0];
            return `${baseUrl}${url}`;
        }
        return url;
    }

    getSellerName(listing: any): string {
        // This would come from the listing data
        return listing.userName || 'Anonymous Seller';
    }

    trackByItemId(index: number, item: CartItem): number {
        return item.listing.id;
    }

    // Calculation methods
    calculateSubtotal(): number {
        return this.cartService.getTotal();
    }

    calculateShipping(): number {
        // Free shipping for orders over $50
        const subtotal = this.calculateSubtotal();
        return subtotal >= 50 ? 0 : 5.99;
    }

    calculateTotal(): number {
        return this.calculateSubtotal() + this.calculateShipping();
    }

    calculateSavings(currentPrice: number): number {
        // Estimate savings vs new - assuming 40-70% savings
        const estimatedNewPrice = currentPrice * 2.5;
        return Math.round(((estimatedNewPrice - currentPrice) / estimatedNewPrice) * 100);
    }

    calculateTotalSavings(): number {
        return this.cartItems.reduce((total, item) => {
            const estimatedNewPrice = item.listing.price * 2.5;
            return total + (estimatedNewPrice - item.listing.price);
        }, 0);
    }

    calculateWaterSaved(): number {
        // Estimate water saved per item (average 2,700L per garment)
        return this.cartItems.length * 2700;
    }

    // Cart actions
    removeItem(listingId: number): void {
        this.cartService.removeFromCart(listingId);
        this.notificationService.show('Item removed from cart', 'info');
    }

    clearCart(): void {
        this.showClearConfirmation = true;
    }

    cancelClearCart(): void {
        this.showClearConfirmation = false;
    }

    confirmClearCart(): void {
        this.cartService.clearCart();
        this.showClearConfirmation = false;
        this.notificationService.show('Cart cleared successfully', 'success');
    }

    saveForLater(listingId: number): void {
        // This would move item to a saved items list
        this.notificationService.show('Item saved for later', 'info');
    }

    viewItemDetails(listingId: number): void {
        this.router.navigate(['/listing', listingId]);
    }

    // Navigation methods
    continueShopping(): void {
        this.router.navigate(['/new-listings']);
    }

    viewRecommendations(): void {
        this.router.navigate(['/new-listings'], { queryParams: { featured: 'true' } });
    }

    proceedToCheckout(): void {
        // In a real app, this would navigate to checkout
        this.notificationService.show(
            `Proceeding to checkout with ${this.cartItems.length} items (Total: $${this.calculateTotal().toFixed(2)})`,
            'info'
        );
    }
}