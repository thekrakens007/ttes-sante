import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {Product, ProductPage} from '../models/product.model';

@Injectable({
    providedIn: 'root'
})
export class ProductService {

    private http = inject(HttpClient);

    private readonly API_URL = '/api/products';


    getProducts(): Observable<Product[]> {
        return this.http.get<Product[]>(this.API_URL);
    }
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