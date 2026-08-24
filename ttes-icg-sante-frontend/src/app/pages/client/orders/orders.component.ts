import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderService } from '../../../core/services/order.service';

@Component({
    selector: 'app-orders',
    standalone: true,
    imports: [
        CommonModule
    ],
    templateUrl: './orders.component.html'
})
export class OrdersComponent {

    private orderService = inject(OrderService);

    orders: any[] = [];

    loading = false;
    errorMessage = '';

    ngOnInit(): void {
        this.loadOrders();
    }

    loadOrders(): void {

        this.loading = true;
        this.errorMessage = '';

        this.orderService.getMyOrders().subscribe({

            next: orders => {

                this.orders = orders;

                this.loading = false;

            },

            error: error => {

                console.error(error);

                this.loading = false;

                this.errorMessage =
                    error?.error?.message ||
                    'Impossible de charger vos commandes.';

            }

        });

    }

    refresh(): void {
        this.loadOrders();
    }

    getStatusLabel(status: string): string {

        switch (status) {

            case 'PENDING':
                return 'En attente';

            case 'CONFIRMED':
                return 'Confirmée';

            case 'PROCESSING':
                return 'En préparation';

            case 'SHIPPED':
                return 'Expédiée';

            case 'DELIVERED':
                return 'Livrée';

            case 'CANCELLED':
                return 'Annulée';

            default:
                return status;

        }

    }

    getStatusColor(status: string): string {

        switch (status) {

            case 'PENDING':
                return 'warning';

            case 'CONFIRMED':
            case 'PROCESSING':
                return 'info';

            case 'SHIPPED':
                return 'primary';

            case 'DELIVERED':
                return 'success';

            case 'CANCELLED':
                return 'error';

            default:
                return 'light';

        }

    }

}