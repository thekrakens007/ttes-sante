import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { GlobalSearchResponse } from '../models/global-search.model';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  private http = inject(HttpClient);

  private readonly API_URL = '/api/search';


  search(
    keyword: string,
    page: number = 0,
    size: number = 8
  ): Observable<GlobalSearchResponse> {

    const params = new HttpParams()
      .set('keyword', keyword)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<GlobalSearchResponse>(
      this.API_URL,
      { params }
    );
  }
}
