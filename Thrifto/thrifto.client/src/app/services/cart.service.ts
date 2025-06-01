// src/app/services/cart.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Listing } from '../models/listing.model';

export interface CartItem {
  listing: Listing;
  // Removed quantity property
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItemsSubject.asObservable();

  constructor() {
    // Load cart from localStorage on startup
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      this.cartItemsSubject.next(JSON.parse(storedCart));
    }
  }

  addToCart(listing: Listing): void {
    const currentItems = this.cartItemsSubject.value;
    const existingItemIndex = currentItems.findIndex(item => item.listing.id === listing.id);

    if (existingItemIndex === -1) {
      // Only add if not already in cart
      currentItems.push({ listing });
      this.cartItemsSubject.next([...currentItems]);
      this.saveCartToStorage();
    }
    // If already in cart, do nothing
  }

  removeFromCart(listingId: number): void {
    const currentItems = this.cartItemsSubject.value;
    const updatedItems = currentItems.filter(item => item.listing.id !== listingId);

    this.cartItemsSubject.next(updatedItems);
    this.saveCartToStorage();
  }

  // Removed updateQuantity method

  clearCart(): void {
    this.cartItemsSubject.next([]);
    localStorage.removeItem('cart');
  }

  getTotal(): number {
    return this.cartItemsSubject.value.reduce(
      // Removed quantity multiplication
      (total, item) => total + item.listing.price,
      0
    );
  }

  getItemCount(): number {
    // Simply return the number of items
    return this.cartItemsSubject.value.length;
  }

  private saveCartToStorage(): void {
    localStorage.setItem('cart', JSON.stringify(this.cartItemsSubject.value));
  }
}
