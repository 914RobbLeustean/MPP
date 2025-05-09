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

  getImageUrl(url: string | null | undefined): string {
    if (!url) {
      return 'assets/images/placeholder.png';
    }
    // If the URL is relative (from your backend)
    if (url.startsWith('/')) {
      const baseUrl = environment.apiUrl.split('/api')[0];
      return `${baseUrl}${url}`;
    }
    return url;
  }

  removeItem(listingId: number): void {
    this.cartService.removeFromCart(listingId);
    this.notificationService.show('Item removed from cart', 'info');
  }

  // Removed increaseQuantity and decreaseQuantity methods

  calculateSubtotal(): number {
    return this.cartService.getTotal();
  }

  calculateShipping(): number {
    // Simple flat shipping rate
    return this.cartItems.length > 0 ? 5 : 0;
  }

  calculateTotal(): number {
    return this.calculateSubtotal() + this.calculateShipping();
  }

  checkout(): void {
    // In a real app, this would navigate to a checkout page or process payment
    this.notificationService.show('This is a demo checkout. In a real app, this would proceed to payment.', 'info');
  }

  continueShopping(): void {
    this.router.navigate(['/']);
  }
}
