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

import {
    AuthService
} from '../../../core/services/auth.service';

import {
    Order
} from '../../../core/models/order.model';


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

    private authService = inject(AuthService);


    orders: Order[] = [];

    loading = true;

    error = '';


    ngOnInit(): void {

        this.loadOrders();

    }


    /**
     * Charger les commandes
     */
    loadOrders(): void {

        this.loading = true;

        this.error = '';

        this.orderService
            .getMyOrders()
            .subscribe({

                next: (orders) => {

                    console.log(
                        'Commandes récupérées :',
                        orders
                    );

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


    /**
     * Déconnexion
     */
    logout(): void {

        console.log('Déconnexion...');

        this.authService.logout();

    }


    /**
     * Format prix
     */
    formatPrice(price: number): string {

        return new Intl.NumberFormat(
            'fr-FR'
        ).format(price) + ' FCFA';

    }

}