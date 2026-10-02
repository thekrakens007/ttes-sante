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
     *
     * La recherche est envoyée au backend uniquement
     * lorsque cette méthode est appelée.
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
