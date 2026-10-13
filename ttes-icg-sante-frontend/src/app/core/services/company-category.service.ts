
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CompanyCategoryResponse } from '../interfaces/company-category-response.interface';

@Injectable({
    providedIn: 'root'
})
export class CompanyCategoryService {

    private http = inject(HttpClient);

    private readonly API_URL = '/api/company-categories';

    getCategories(): Observable<CompanyCategoryResponse[]> {
        return this.http.get<CompanyCategoryResponse[]>(
            this.API_URL
        );
    }
}
