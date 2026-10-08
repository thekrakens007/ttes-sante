import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Product, ProductPage } from '../models/product.model';

@Injectable({
    providedIn: 'root'
})
export class ProductService {

    private http = inject(HttpClient);

    private readonly API_URL = '/api/products';

    /**
     * Récupérer tous les produits
     */
    getProducts(): Observable<Product[]> {
        return this.http.get<Product[]>(this.API_URL);
    }

    /**
     * Récupérer les produits avec pagination
     */
    getProductsPaginated(
        page: number = 0,
        size: number = 12
    ): Observable<ProductPage> {

        const params = new HttpParams()
            .set('page', page)
            .set('size', size);

        return this.http.get<ProductPage>(
            `${this.API_URL}/paginated`,
            { params }
        );
    }

    /**
     * Rechercher des produits avec pagination
     */
    searchProductsPaginated(
        keyword: string,
        page: number = 0,
        size: number = 12
    ): Observable<ProductPage> {

        const params = new HttpParams()
            .set('keyword', keyword.trim())
            .set('page', page)
            .set('size', size);

        return this.http.get<ProductPage>(
            `${this.API_URL}/search`,
            { params }
        );
    }

    /**
     * Récupérer les produits avec recherche + filtres + pagination
     */
    getProductsFiltered(
        page: number = 0,
        size: number = 12,
        keyword?: string,
        categoryId?: number | null,
        companyId?: number | null,
        therapeuticAreaId?: number | null
    ): Observable<ProductPage> {

        let params = new HttpParams()
            .set('page', page)
            .set('size', size);

        if (keyword?.trim()) {
            params = params.set('keyword', keyword.trim());
        }

        if (categoryId != null) {
            params = params.set('categoryId', categoryId);
        }

        if (companyId != null) {
            params = params.set('companyId', companyId);
        }

        if (therapeuticAreaId != null) {
            params = params.set('therapeuticAreaId', therapeuticAreaId);
        }

        return this.http.get<ProductPage>(
            `${this.API_URL}/paginated`,
            { params }
        );
    }

    /**
     * Récupérer un produit par son ID
     */
    getProduct(productId: number): Observable<Product> {
        return this.http.get<Product>(
            `${this.API_URL}/${productId}`
        );
    }

    /**
     * Recherche simple
     */
    searchProducts(name: string): Observable<Product[]> {

        const params = new HttpParams()
            .set('name', name.trim());

        return this.http.get<Product[]>(
            `${this.API_URL}/search`,
            { params }
        );
    }

    /**
     * Récupérer les produits d'une entreprise
     */
    getProductsByCompany(companyId: number): Observable<Product[]> {
        return this.http.get<Product[]>(
            `${this.API_URL}/company/${companyId}`
        );
    }
}
