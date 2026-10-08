import { Injectable, inject } from '@angular/core';

import {
    HttpClient,
    HttpParams
} from '@angular/common/http';

import {
    Observable
} from 'rxjs';

import {
    GlobalSearchResponse
} from '../models/global-search.model';

@Injectable({
    providedIn: 'root'
})
export class SearchService {

    private http = inject(HttpClient);


    private readonly apiUrl =
        '/api/search';


    search(
        keyword: string,
        page: number = 0,
        size: number = 8,
        categoryId?: number | null,
        companyId?: number | null,
        therapeuticAreaId?: number | null
    ): Observable<GlobalSearchResponse> {

        let params =
            new HttpParams()
                .set(
                    'q',
                    keyword
                )
                .set(
                    'page',
                    page
                )
                .set(
                    'size',
                    size
                );


        if (
            categoryId !== null &&
            categoryId !== undefined
        ) {

            params =
                params.set(
                    'categoryId',
                    categoryId
                );
        }


        if (
            companyId !== null &&
            companyId !== undefined
        ) {

            params =
                params.set(
                    'companyId',
                    companyId
                );
        }


        if (
            therapeuticAreaId !== null &&
            therapeuticAreaId !== undefined
        ) {

            params =
                params.set(
                    'therapeuticAreaId',
                    therapeuticAreaId
                );
        }


        return this.http.get<GlobalSearchResponse>(
            this.apiUrl,
            {
                params
            }
        );
    }
}
