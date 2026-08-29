import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
    CreateOrderRequest,
    Order
} from '../models/order.model';

@Injectable({
    providedIn: 'root'
})
export class OrderService {

    private http = inject(HttpClient);

    private readonly API_URL = '/api/orders';

    //private readonly API_URL = 'http://localhost:8080/api/orders';


    createOrder(
        request: CreateOrderRequest
    ): Observable<Order> {

        return this.http.post<Order>(
            this.API_URL,
            request
        );

    }


    getMyOrders(): Observable<Order[]> {

        return this.http.get<Order[]>(
            `${this.API_URL}/me`
        );

    }

}