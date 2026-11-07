
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cure, CureRequest } from '../models/cure.model';

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class CureService {

    private readonly http = inject(HttpClient);

    private readonly apiUrl = '/api/cures';
    private readonly adminUrl = '/api/admin/cures';

    // Partie publique avec pagination
    getCures(page: number = 0, size: number = 8): Observable<PageResponse<Cure>> {
        const params = new HttpParams()
            .set('page', page)
            .set('size', size);

        return this.http.get<PageResponse<Cure>>(this.apiUrl, { params });
    }

    getCure(id: number): Observable<Cure> {
        return this.http.get<Cure>(`${this.apiUrl}/${id}`);
    }

    // Administration avec pagination
    getAdminCures(page: number = 0, size: number = 8): Observable<PageResponse<Cure>> {
        const params = new HttpParams()
            .set('page', page)
            .set('size', size);

        return this.http.get<PageResponse<Cure>>(this.adminUrl, { params });
    }

    getAdminCure(id: number): Observable<Cure> {
        return this.http.get<Cure>(`${this.adminUrl}/${id}`);
    }

    createCure(request: CureRequest): Observable<Cure> {
        return this.http.post<Cure>(this.adminUrl, request);
    }

    updateCure(id: number, request: CureRequest): Observable<Cure> {
        return this.http.put<Cure>(`${this.adminUrl}/${id}`, request);
    }

    deleteCure(id: number): Observable<void> {
        return this.http.delete<void>(`${this.adminUrl}/${id}`);
    }
}
