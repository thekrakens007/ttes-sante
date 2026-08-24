import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminService } from '../../core/services/admin.service';
import { OrderResponse } from '../../core/interfaces/order-response.interface';

import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';

@Component({
    selector: 'app-orders',
    standalone: true,

    imports: [
        CommonModule,
        BadgeComponent
    ],

    templateUrl: './orders.component.html'
})
export class OrdersComponent implements OnInit {

    private adminService = inject(AdminService);

    orders: OrderResponse[] = [];

    loading = true;

    errorMessage = '';

    successMessage = '';

    updatingOrderId: number | null = null;


    // ================================
    // STATUTS
    // ================================

    statuses = [
        {
            value: 'PENDING',
            label: 'En attente'
        },
        {
            value: 'CONFIRMED',
            label: 'Confirmée'
        },
        {
            value: 'SHIPPED',
            label: 'Expédiée'
        },
        {
            value: 'DELIVERED',
            label: 'Livrée'
        },
        {
            value: 'CANCELLED',
            label: 'Annulée'
        }
    ];


    // ================================
    // INITIALISATION
    // ================================

    ngOnInit(): void {

        this.loadOrders();

    }


    // ================================
    // CHARGER LES COMMANDES
    // ================================

    loadOrders(): void {

        this.loading = true;

        this.errorMessage = '';

        this.adminService.getOrders().subscribe({

            next: (orders) => {

                this.orders = orders;

                this.loading = false;

            },

            error: (error) => {

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


    // ================================
    // MODIFIER LE STATUT
    // ================================

    updateStatus(
        order: OrderResponse,
        status: string
    ): void {

        if (!status) {
            return;
        }

        if (order.status === status) {
            return;
        }

        this.updatingOrderId = order.id;

        this.successMessage = '';

        this.errorMessage = '';

        this.adminService
            .updateOrderStatus(
                order.id,
                status
            )
            .subscribe({

                next: (updatedOrder) => {

                    order.status =
                        updatedOrder.status;

                    this.updatingOrderId = null;

                    this.successMessage =
                        `Le statut de la commande #${order.id} a été mis à jour.`;

                    setTimeout(() => {

                        this.successMessage = '';

                    }, 3000);

                },

                error: (error) => {

                    console.error(
                        'Erreur modification statut :',
                        error
                    );

                    this.updatingOrderId = null;

                    this.errorMessage =
                        error?.error?.message ??
                        'Impossible de modifier le statut de la commande.';

                }

            });

    }


    // ================================
    // LABEL STATUT
    // ================================

    getStatusLabel(
        status: string
    ): string {

        const found =
            this.statuses.find(
                item => item.value === status
            );

        return found?.label ?? status;

    }


    // ================================
    // COULEUR BADGE
    // ================================

    getBadgeColor(
        status: string
    ): 'success' | 'warning' | 'error' {

        switch (status) {

            case 'DELIVERED':
                return 'success';

            case 'PENDING':
            case 'CONFIRMED':
            case 'SHIPPED':
                return 'warning';

            case 'CANCELLED':
            default:
                return 'error';

        }

    }


    // ================================
    // MONTANT
    // ================================

    formatCurrency(
        amount: number
    ): string {

        return new Intl.NumberFormat(
            'fr-FR',
            {
                style: 'currency',
                currency: 'XAF',
                maximumFractionDigits: 0
            }
        ).format(amount);

    }


    // ================================
    // NOMBRE D'ARTICLES
    // ================================

    getItemsCount(
        order: OrderResponse
    ): number {

        if (!order.items) {
            return 0;
        }

        return order.items.reduce(
            (total, item) =>
                total + item.quantity,
            0
        );

    }


    // ================================
    // PRODUITS
    // ================================

    getProducts(
        order: OrderResponse
    ): string {

        if (
            !order.items ||
            order.items.length === 0
        ) {

            return 'Aucun produit';

        }

        if (order.items.length === 1) {

            return order.items[0].productName;

        }

        return `${order.items[0].productName} + ${
            order.items.length - 1
        } autre(s)`;

    }


    // ================================
    // RAFRAÎCHIR
    // ================================

    refresh(): void {

        this.loadOrders();

    }

    protected getFirstProductName(order: OrderResponse): string {

        if (
            !order.items ||
            order.items.length === 0
        ) {
            return 'Aucun produit';
        }

        if (order.items.length === 1) {
            return order.items[0].productName;
        }

        return `${order.items[0].productName} + ${
            order.items.length - 1
        } autre(s)`;
    }
}