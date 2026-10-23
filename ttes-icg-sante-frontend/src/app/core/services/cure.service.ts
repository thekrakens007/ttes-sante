
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cure, CureRequest } from '../models/cure.model';

@Injectable({
    providedIn: 'root'
})
export class CureService {
    private readonly http = inject(HttpClient);

    private readonly apiUrl = '/api/cures';
    private readonly adminUrl = '/api/admin/cures';

    // Partie publique
    getCures(): Observable<Cure[]> {
        return this.http.get<Cure[]>(this.apiUrl);
    }

    getCure(id: number): Observable<Cure> {
        return this.http.get<Cure>(`${this.apiUrl}/${id}`);
    }

    // Administration
    getAdminCures(): Observable<Cure[]> {
        return this.http.get<Cure[]>(this.adminUrl);
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
