import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
    providedIn: 'root'
})
export class ProductService {

    private http = inject(HttpClient);

    private readonly API_URL = 'http://localhost:8080/api/products';

    getProducts(): Observable<Product[]> {
        return this.http.get<Product[]>(this.API_URL);
    }

    getProduct(productId: number): Observable<Product> {
        return this.http.get<Product>(
            `${this.API_URL}/${productId}`
        );
    }

    searchProducts(name: string): Observable<Product[]> {

        const params = new HttpParams()
            .set('name', name);

        return this.http.get<Product[]>(
            `${this.API_URL}/search`,
            { params }
        );
    }

    getProductsByCompany(companyId: number): Observable<Product[]> {
        return this.http.get<Product[]>(
            `${this.API_URL}/company/${companyId}`
        );
    }
}