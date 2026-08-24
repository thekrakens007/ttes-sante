import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminService } from '../../../../core/services/admin.service';
import { OrderResponse } from '../../../../core/interfaces/order-response.interface';

@Component({
    selector: 'app-recent-orders',
    standalone: true,
    imports: [
        CommonModule
    ],
    templateUrl: './recent-orders.component.html'
})
export class RecentOrdersComponent implements OnInit {

    private adminService = inject(AdminService);

    orders: OrderResponse[] = [];

    loading = false;

    updatingOrderId: number | null = null;

    errorMessage = '';

    ngOnInit(): void {

        this.loadOrders();

    }


    // ==========================================
    // CHARGER LES COMMANDES
    // ==========================================

    loadOrders(): void {

        this.loading = true;

        this.errorMessage = '';

        this.adminService
            .getOrders()
            .subscribe({

                next: orders => {

                    this.orders = orders;

                    this.loading = false;

                },

                error: error => {

                    console.error(
                        'Erreur chargement commandes :',
                        error
                    );

                    this.errorMessage =
                        'Impossible de charger les commandes.';

                    this.loading = false;

                }

            });

    }


    // ==========================================
    // MODIFIER LE STATUT
    // ==========================================

    updateStatus(
        order: OrderResponse,
        status: string
    ): void {

        if (!status || order.status === status) {
            return;
        }

        this.updatingOrderId = order.id;

        this.adminService
            .updateOrderStatus(
                order.id,
                status
            )
            .subscribe({

                next: updatedOrder => {

                    order.status =
                        updatedOrder.status;

                    this.updatingOrderId = null;

                },

                error: error => {

                    console.error(
                        'Erreur modification statut :',
                        error
                    );

                    this.updatingOrderId = null;

                    this.errorMessage =
                        'Impossible de modifier le statut de la commande.';

                }

            });

    }


    // ==========================================
    // COULEUR DU STATUT
    // ==========================================

    getStatusClass(status: string): string {

        switch (status) {

            case 'PENDING':
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400';

            case 'CONFIRMED':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';

            case 'SHIPPED':
                return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400';

            case 'DELIVERED':
                return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';

            case 'CANCELLED':
                return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';

            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400';
        }
    }

    // ==========================================
    // TRADUCTION DU STATUT
    // ==========================================

    getStatusLabel(status: string): string {

        switch (status) {

            case 'PENDING':
                return 'En attente';

            case 'CONFIRMED':
                return 'Confirmée';

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



    // ==========================================
    // RAFRAÎCHIR
    // ==========================================

    refresh(): void {

        this.loadOrders();

    }



}