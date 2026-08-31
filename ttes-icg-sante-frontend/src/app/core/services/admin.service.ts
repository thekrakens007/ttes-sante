import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { UserAdminResponse } from '../interfaces/user-admin-response.interface';
import { ProductResponse } from '../interfaces/product-response.interface';
import { OrderResponse } from '../interfaces/order-response.interface';
import {TherapeuticAreaResponse} from "../interfaces/therapeutic-area-response.interface";
import {CategoryResponse} from "../interfaces/category-response.interface";
import {CompanyResponse} from "../interfaces/company-response.interface";
import {TherapeuticAreaRequest} from "../interfaces/therapeutic-area-request.interface";
import {InventoryResponse} from "../interfaces/inventory-response.interface";
import {InventoryRequest} from "../interfaces/inventory-request.interface";
import {ProductImageResponse} from "../interfaces/product-image-response.interface";

@Injectable({
    providedIn: 'root'
})
export class AdminService {

    private http = inject(HttpClient);
    private readonly API_URL = '/api/admin';


    // =========================
    // USERS
    // =========================

    getUsers(): Observable<UserAdminResponse[]> {

        return this.http.get<UserAdminResponse[]>(
            `${this.API_URL}/users`
        );

    }
    getProductImages(productId: number) {
        return this.http.get<ProductImageResponse[]>(
            `${this.API_URL}/products/${productId}/images`
        );
    }

    getUser(id: number): Observable<UserAdminResponse> {

        return this.http.get<UserAdminResponse>(
            `${this.API_URL}/users/${id}`
        );

    }

    deleteProduct(productId: number): Observable<void> {

        return this.http.delete<void>(
            `${this.API_URL}/products/${productId}`
        );

    }


    addProductImage(
        productId: number,
        request: {
            imageUrl: string;
            main: boolean;
            displayOrder: number;
        }
    ) {

        return this.http.post<ProductImageResponse>(
            `${this.API_URL}/products/${productId}/images`,
            request
        );
    }

    deleteProductImage(imageId: number) {
        return this.http.delete(
            `${this.API_URL}/products/images/${imageId}`
        );
    }


    updateUser(
        id: number,
        request: any
    ): Observable<UserAdminResponse> {

        return this.http.put<UserAdminResponse>(
            `${this.API_URL}/users/${id}`,
            request
        );

    }


    updateUserStatus(
        id: number,
        enabled: boolean
    ): Observable<UserAdminResponse> {

        return this.http.patch<UserAdminResponse>(
            `${this.API_URL}/users/${id}/status?enabled=${enabled}`,
            {}
        );

    }


    deleteUser(id: number): Observable<void> {

        return this.http.delete<void>(
            `${this.API_URL}/users/${id}`
        );

    }


    // =========================
    // PRODUCTS
    // =========================

    getProducts(): Observable<ProductResponse[]> {

        return this.http.get<ProductResponse[]>(
            `${this.API_URL}/products`
        );

    }


    createProduct(request: any): Observable<ProductResponse> {

        return this.http.post<ProductResponse>(
            `${this.API_URL}/products`,
            request
        );

    }


    updateProduct(
        id: number,
        request: any
    ): Observable<ProductResponse> {

        return this.http.put<ProductResponse>(
            `${this.API_URL}/products/${id}`,
            request
        );

    }


    // =========================
    // ORDERS
    // =========================

    getOrders(): Observable<OrderResponse[]> {

        return this.http.get<OrderResponse[]>(
            `${this.API_URL}/orders`
        );

    }


    updateOrderStatus(
        id: number,
        status: string
    ): Observable<OrderResponse> {

        return this.http.put<OrderResponse>(
            `${this.API_URL}/orders/${id}/status`,
            {
                status: status
            }
        );

    }
    getCompanies(): Observable<CompanyResponse[]> {

        return this.http.get<CompanyResponse[]>(
            `${this.API_URL}/companies`
        );

    }





    getProduct(productId: number): Observable<ProductResponse> {

        return this.http.get<ProductResponse>(
            `${this.API_URL}/products/${productId}`
        );

    }

    // =========================
// INVENTORY
// =========================

    getInventory(
        productId: number
    ): Observable<InventoryResponse> {

        return this.http.get<InventoryResponse>(
            `${this.API_URL}/api/inventory/product/${productId}`
        );

    }


    updateInventory(
        productId: number,
        request: InventoryRequest
    ): Observable<InventoryResponse> {

        return this.http.put<InventoryResponse>(
            `${this.API_URL}/api/inventory/product/${productId}`,
            request
        );

    }

    // =========================
// CATEGORIES
// =========================

    getCategories(): Observable<CategoryResponse[]> {

        return this.http.get<CategoryResponse[]>(
            `${this.API_URL}/categories`
        );

    }


    getCategory(id: number): Observable<CategoryResponse> {

        return this.http.get<CategoryResponse>(
            `${this.API_URL}/categories/${id}`
        );

    }


    createCategory(
        request: any
    ): Observable<CategoryResponse> {

        return this.http.post<CategoryResponse>(
            `${this.API_URL}/categories`,
            request
        );

    }

    getCompany(id: number): Observable<CompanyResponse> {

        return this.http.get<CompanyResponse>(
            `${this.API_URL}/companies/${id}`
        );

    }


    createCompany(request: any): Observable<CompanyResponse> {

        return this.http.post<CompanyResponse>(
            `${this.API_URL}/companies`,
            request
        );

    }


    deleteCompany(id: number): Observable<void> {

        return this.http.delete<void>(
            `${this.API_URL}/companies/${id}`
        );

    }

    updateCompany(
        id: number,
        request: any
    ): Observable<CompanyResponse> {

        return this.http.put<CompanyResponse>(
            `${this.API_URL}/companies/${id}`,
            request
        );

    }
// =========================
// THERAPEUTIC AREAS
// =========================

    getTherapeuticAreas(): Observable<TherapeuticAreaResponse[]> {

        return this.http.get<TherapeuticAreaResponse[]>(
            `${this.API_URL}/therapeutic-areas`
        );

    }

    getTherapeuticArea(
        id: number
    ): Observable<TherapeuticAreaResponse> {

        return this.http.get<TherapeuticAreaResponse>(
            `${this.API_URL}/therapeutic-areas/${id}`
        );

    }

    createTherapeuticArea(
        request: TherapeuticAreaRequest
    ): Observable<TherapeuticAreaResponse> {

        return this.http.post<TherapeuticAreaResponse>(
            `${this.API_URL}/therapeutic-areas`,
            request
        );

    }

    updateTherapeuticArea(
        id: number,
        request: TherapeuticAreaRequest
    ): Observable<TherapeuticAreaResponse> {

        return this.http.put<TherapeuticAreaResponse>(
            `${this.API_URL}/therapeutic-areas/${id}`,
            request
        );

    }

    deleteTherapeuticArea(
        id: number
    ): Observable<void> {

        return this.http.delete<void>(
            `${this.API_URL}/therapeutic-areas/${id}`
        );

    }
    updateCategory(
        id: number,
        request: any
    ): Observable<CategoryResponse> {

        return this.http.put<CategoryResponse>(
            `${this.API_URL}/categories/${id}`,
            request
        );

    }


    deleteCategory(id: number): Observable<void> {

        return this.http.delete<void>(
            `${this.API_URL}/categories/${id}`
        );

    }
}