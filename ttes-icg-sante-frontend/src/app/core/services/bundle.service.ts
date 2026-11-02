import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { BundleResponse } from '../interfaces/bundle-response.interface';
import { BundleRequest } from '../interfaces/bundle-request.interface';
import {PageResponse} from "../interfaces/page-response.interface";

@Injectable({
    providedIn: 'root'
})
export class BundleService {

    private http = inject(HttpClient);

    private readonly API_URL = '/api/bundles';
    private readonly ADMIN_API_URL = '/api/admin/bundles';


    /**
     * =====================================================
     * ESPACE CLIENT
     * =====================================================
     */




    getBundle(id: number): Observable<BundleResponse> {

        return this.http.get<BundleResponse>(
            `${this.API_URL}/${id}`
        );

    }


    /**
     * =====================================================
     * ESPACE ADMIN
     * =====================================================
     */



    getAdminBundle(id: number): Observable<BundleResponse> {

        return this.http.get<BundleResponse>(
            `${this.ADMIN_API_URL}/${id}`
        );

    }


    createBundle(
        request: BundleRequest
    ): Observable<BundleResponse> {

        return this.http.post<BundleResponse>(
            this.ADMIN_API_URL,
            request
        );

    }


    updateBundle(
        id: number,
        request: BundleRequest
    ): Observable<BundleResponse> {

        return this.http.put<BundleResponse>(
            `${this.ADMIN_API_URL}/${id}`,
            request
        );

    }


    deleteBundle(
        id: number
    ): Observable<void> {

        return this.http.delete<void>(
            `${this.ADMIN_API_URL}/${id}`
        );

    }

    getBundles(
        page = 0,
        size = 8
    ): Observable<PageResponse<BundleResponse>> {
        return this.http.get<PageResponse<BundleResponse>>(
            `${this.API_URL}?page=${page}&size=${size}`
        );
    }

    getAdminBundles(
        page = 0,
        size = 8
    ): Observable<PageResponse<BundleResponse>> {
        return this.http.get<PageResponse<BundleResponse>>(
            `${this.ADMIN_API_URL}?page=${page}&size=${size}`
        );
    }

}