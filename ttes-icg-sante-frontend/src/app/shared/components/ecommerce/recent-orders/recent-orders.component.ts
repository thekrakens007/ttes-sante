import { Component, OnInit, inject } from '@angular/core';

import { BadgeComponent } from '../../ui/badge/badge.component';

import { AdminService } from '../../../../core/services/admin.service';

import {
  OrderResponse
} from '../../../../core/interfaces/order-response.interface';
import {RouterLink} from "@angular/router";


@Component({
  selector: 'app-recent-orders',

  imports: [
    BadgeComponent,
    RouterLink
  ],

  templateUrl: './recent-orders.component.html'
})
export class RecentOrdersComponent implements OnInit {

  private adminService = inject(AdminService);


  orders: OrderResponse[] = [];

  loading = true;

  errorMessage = '';


  ngOnInit(): void {

    this.loadOrders();

  }


  loadOrders(): void {

    this.loading = true;

    this.errorMessage = '';


    this.adminService.getOrders().subscribe({

      next: (orders) => {

        /*
         * Le backend retourne déjà les commandes
         * par ordre décroissant de création.
         *
         * On garde seulement les 5 dernières
         * pour le dashboard.
         */

        this.orders = orders.slice(0, 5);

        this.loading = false;

      },


      error: (error) => {

        console.error(
            'Erreur chargement commandes:',
            error
        );

        this.errorMessage =
            'Impossible de charger les commandes.';

        this.loading = false;

      }

    });

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


  getBadgeColor(
      status: string
  ): 'success' | 'warning' | 'error' {

    switch (status) {

      case 'DELIVERED':
        return 'success';

      case 'PENDING':
      case 'CONFIRMED':
      case 'PROCESSING':
      case 'SHIPPED':
        return 'warning';

      case 'CANCELLED':
      default:
        return 'error';

    }

  }


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


  getFirstProductName(
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


  refresh(): void {

    this.loadOrders();

  }

}