import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
    Router,
    RouterModule,
    RouterLink,
    RouterLinkActive
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
        RouterModule,
        RouterLink,
        RouterLinkActive
    ],

    templateUrl: './my-orders.component.html'
})
export class MyOrdersComponent implements OnInit {


    // ==========================================
    // SERVICES
    // ==========================================

    private orderService =
        inject(OrderService);

    private authService =
        inject(AuthService);

    private router =
        inject(Router);


    // ==========================================
    // COMMANDES
    // ==========================================

    orders: Order[] = [];


    // ==========================================
    // ETAT
    // ==========================================

    loading = true;

    error = '';


    // ==========================================
    // MENU MOBILE
    // ==========================================

    mobileMenuOpen = false;


    // ==========================================
    // INITIALISATION
    // ==========================================

    ngOnInit(): void {

        this.loadOrders();

    }


    // ==========================================
    // MENU MOBILE
    // ==========================================

    toggleMobileMenu(): void {

        this.mobileMenuOpen =
            !this.mobileMenuOpen;

    }


    closeMobileMenu(): void {

        this.mobileMenuOpen = false;

    }


    // ==========================================
    // CHARGER LES COMMANDES
    // ==========================================

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
                        ??
                        'Impossible de charger vos commandes.';

                    this.loading = false;

                }

            });

    }


    // ==========================================
    // DECONNEXION
    // ==========================================

    logout(): void {

        console.log(
            'Déconnexion...'
        );

        this.mobileMenuOpen = false;

        this.authService.logout();

        this.router.navigate([
            '/'
        ]);

    }


    // ==========================================
    // FORMAT PRIX
    // ==========================================

    formatPrice(
        price: number
    ): string {

        return new Intl.NumberFormat(
                'fr-FR'
            ).format(price)
            + ' FCFA';

    }

}