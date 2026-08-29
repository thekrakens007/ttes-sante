import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {AddCartItemRequest, Cart, CartItemRequest, CartResponse} from "../interfaces/cart.interface";

@Injectable({
    providedIn: 'root'
})
export class CartService {

    private http = inject(HttpClient);

    private readonly API_URL = '/api/cart';

    //private readonly API_URL = 'http://localhost:8080/api/cart';


    /**
     * Récupérer le panier du client connecté
     */
    getCart(): Observable<Cart> {

        return this.http.get<Cart>(
            `${this.API_URL}/me`
        );

    }


    /**
     * Ajouter un produit
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
     * Modifier la quantité
     */
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


    /**
     * Supprimer un article
     */
    removeItem(
        itemId: number
    ): Observable<Cart> {

        return this.http.delete<Cart>(
            `${this.API_URL}/me/items/${itemId}`
        );

    }

}