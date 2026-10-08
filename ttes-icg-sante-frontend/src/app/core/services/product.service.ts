import { Injectable, inject } from '@angular/core';
import {
    HttpClient,
    HttpParams
} from '@angular/common/http';

import { Observable } from 'rxjs';

import {
    Product,
    ProductPage
} from '../models/product.model';

@Injectable({
    providedIn: 'root'
})
export class ProductService {

    private http = inject(HttpClient);

    private readonly API_URL = '/api/products';


    // =========================================================
    // TOUS LES PRODUITS
    // =========================================================

    getProducts(): Observable<Product[]> {

        return this.http.get<Product[]>(
            this.API_URL
        );

    }


    // =========================================================
    // PRODUITS AVEC PAGINATION + FILTRES
    // =========================================================

    getProductsPaginated(
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


        // -----------------------------------------------------
        // RECHERCHE
        // -----------------------------------------------------

        if (keyword && keyword.trim().length > 0) {

            params = params.set(
                'keyword',
                keyword.trim()
            );

        }


        // -----------------------------------------------------
        // CATÉGORIE
        // -----------------------------------------------------

        if (categoryId !== null && categoryId !== undefined) {

            params = params.set(
                'categoryId',
                categoryId
            );

        }


        // -----------------------------------------------------
        // ENTREPRISE
        // -----------------------------------------------------

        if (companyId !== null && companyId !== undefined) {

            params = params.set(
                'companyId',
                companyId
            );

        }


        // -----------------------------------------------------
        // DOMAINE THÉRAPEUTIQUE
        // -----------------------------------------------------

        if (
            therapeuticAreaId !== null &&
            therapeuticAreaId !== undefined
        ) {

            params = params.set(
                'therapeuticAreaId',
                therapeuticAreaId
            );

        }


        return this.http.get<ProductPage>(
            `${this.API_URL}/paginated`,
            {
                params
            }
        );

    }


    // =========================================================
    // RECHERCHE AVEC PAGINATION
    // =========================================================

    searchProductsPaginated(
        keyword: string,
        page: number = 0,
        size: number = 12
    ): Observable<ProductPage> {

        const params = new HttpParams()
            .set(
                'keyword',
                keyword.trim()
            )
            .set(
                'page',
                page
            )
            .set(
                'size',
                size
            );

        return this.http.get<ProductPage>(
            `${this.API_URL}/search`,
            {
                params
            }
        );

    }


    // =========================================================
    // PRODUIT PAR ID
    // =========================================================

    getProduct(
        productId: number
    ): Observable<Product> {

        return this.http.get<Product>(
            `${this.API_URL}/${productId}`
        );

    }


    // =========================================================
    // RECHERCHE SIMPLE
    // =========================================================

    searchProducts(
        name: string
    ): Observable<Product[]> {

        const params = new HttpParams()
            .set(
                'name',
                name.trim()
            );

        return this.http.get<Product[]>(
            `${this.API_URL}/search`,
            {
                params
            }
        );

    }


    // =========================================================
    // PRODUITS D'UNE ENTREPRISE
    // =========================================================

    getProductsByCompany(
        companyId: number
    ): Observable<Product[]> {

        return this.http.get<Product[]>(
            `${this.API_URL}/company/${companyId}`
        );

    }


    // =========================================================
    // CATÉGORIES
    // =========================================================

    getCategories(): Observable<any[]> {

        return this.http.get<any[]>(
            '/api/categories'
        );

    }


    // =========================================================
    // ENTREPRISES
    // =========================================================

    getCompanies(): Observable<any[]> {

        return this.http.get<any[]>(
            '/api/companies'
        );

    }


    // =========================================================
    // DOMAINES THÉRAPEUTIQUES
    // =========================================================

    getTherapeuticAreas(): Observable<any[]> {

        return this.http.get<any[]>(
            '/api/therapeutic-areas'
        );

    }

}
