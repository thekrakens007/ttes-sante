import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
    RouterModule
} from '@angular/router';

import {
    OrderService
} from '../../../core/services/order.service';
import {OrderResponse} from "../../../core/interfaces/order-response.interface";
import {Order} from "../../../core/models/order.model";


@Component({
    selector: 'app-my-orders',
    standalone: true,

    imports: [
        CommonModule,
        RouterModule
    ],

    templateUrl: './my-orders.component.html'
})
export class MyOrdersComponent implements OnInit {

    private orderService = inject(OrderService);


    orders: Order[] = [];

    loading = true;

    error = '';


    ngOnInit(): void {

        this.loadOrders();

    }


    loadOrders(): void {

        this.loading = true;

        this.error = '';


        this.orderService
            .getMyOrders()
            .subscribe({

                next: (orders) => {

                    this.orders = orders;

                    this.loading = false;

                },

                error: (error) => {

                    console.error(
                        'Erreur chargement commandes',
                        error
                    );

                    this.error =
                        error?.error?.message
                        ?? 'Impossible de charger vos commandes.';

                    this.loading = false;

                }

            });

    }


    formatPrice(price: number): string {

        return new Intl.NumberFormat(
            'fr-FR'
        ).format(price) + ' FCFA';

    }

}