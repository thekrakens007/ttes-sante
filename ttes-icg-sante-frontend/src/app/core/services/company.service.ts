import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CompanyResponse } from '../interfaces/company-response.interface';
import { ProductResponse } from '../interfaces/product-response.interface';

@Injectable({
    providedIn: 'root'
})
export class CompanyService {

    private http = inject(HttpClient);

    private readonly API_URL =
        'http://localhost:8080/api/companies';


    // =====================================================
    // LISTE DES ENTREPRISES
    // =====================================================

    getCompanies(): Observable<CompanyResponse[]> {

        return this.http.get<CompanyResponse[]>(
            this.API_URL
        );

    }


    // =====================================================
    // DETAIL ENTREPRISE
    // =====================================================

    getCompany(
        companyId: number
    ): Observable<CompanyResponse> {

        return this.http.get<CompanyResponse>(
            `${this.API_URL}/${companyId}`
        );

    }


    // =====================================================
    // PRODUITS DE L'ENTREPRISE
    // =====================================================

    getCompanyProducts(
        companyId: number
    ): Observable<ProductResponse[]> {

        return this.http.get<ProductResponse[]>(
            `${this.API_URL}/${companyId}/products`
        );

    }

}