import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
    Cart,
    CartItemRequest
} from '../interfaces/cart.interface';

@Injectable({
    providedIn: 'root'
})
export class CartService {

    private http = inject(HttpClient);

    private readonly API_URL = '/api/cart';

    getCart(): Observable<Cart> {
        return this.http.get<Cart>(
            `${this.API_URL}/me`
        );
    }

    /**
     * Ajouter un produit au panier.
     */
    addItem(
        productId: number,
        quantity: number = 1
    ): Observable<Cart> {

        const request: CartItemRequest = {
            productId,
            quantity
        };

        return this.http.post<Cart>(
            `${this.API_URL}/me/items`,
            request
        );
    }

    /**
     * Ajouter un pack au panier.
     */
    addBundle(
        bundleId: number,
        quantity: number = 1
    ): Observable<Cart> {

        const request: CartItemRequest = {
            bundleId,
            quantity
        };

        return this.http.post<Cart>(
            `${this.API_URL}/me/items`,
            request
        );
    }

    updateQuantity(
        itemId: number,
        quantity: number
    ): Observable<Cart> {

        return this.http.put<Cart>(
            `${this.API_URL}/me/items/${itemId}`,
            null,
            {
                params: {
                    quantity: quantity.toString()
                }
            }
        );
    }

    removeItem(
        itemId: number
    ): Observable<Cart> {

        return this.http.delete<Cart>(
            `${this.API_URL}/me/items/${itemId}`
        );
    }
}