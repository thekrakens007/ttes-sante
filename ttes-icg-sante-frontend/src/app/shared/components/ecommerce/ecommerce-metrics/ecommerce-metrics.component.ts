import { Component, OnInit, inject } from '@angular/core';

import { BadgeComponent } from '../../ui/badge/badge.component';
import { SafeHtmlPipe } from '../../../pipe/safe-html.pipe';

import { AdminService } from '../../../../core/services/admin.service';

import { UserAdminResponse } from '../../../../core/interfaces/user-admin-response.interface';
import { ProductResponse } from '../../../../core/interfaces/product-response.interface';
import { OrderResponse } from '../../../../core/interfaces/order-response.interface';
import {DecimalPipe} from "@angular/common";

@Component({
  selector: 'app-ecommerce-metrics',
  imports: [
    BadgeComponent,
    SafeHtmlPipe,
    DecimalPipe
  ],
  templateUrl: './ecommerce-metrics.component.html'
})
export class EcommerceMetricsComponent implements OnInit {

  private adminService = inject(AdminService);


  // =========================
  // STATISTIQUES
  // =========================

  usersCount = 0;

  productsCount = 0;

  ordersCount = 0;

  totalRevenue = 0;


  // =========================
  // ETAT
  // =========================

  loading = true;

  errorMessage = '';


  // =========================
  // ICONES
  // =========================

  public icons = {

    groupIcon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="text-gray-800 size-6 dark:text-white/90">

      <path fill-rule="evenodd" clip-rule="evenodd"
        d="M8.80443 5.60156C7.59109 5.60156 6.60749 6.58517 6.60749 7.79851C6.60749 9.01185 7.59109 9.99545 8.80443 9.99545C10.0178 9.99545 11.0014 9.01185 11.0014 7.79851C11.0014 6.58517 10.0178 5.60156 8.80443 5.60156ZM5.10749 7.79851C5.10749 5.75674 6.76267 4.10156 8.80443 4.10156C10.8462 4.10156 12.5014 5.75674 12.5014 7.79851C12.5014 9.84027 10.8462 11.4955 8.80443 11.4955C6.76267 11.4955 5.10749 9.84027 5.10749 7.79851ZM4.86252 15.3208C4.08769 16.0881 3.70377 17.0608 3.51705 17.8611C3.48384 18.0034 3.5211 18.1175 3.60712 18.2112C3.70161 18.3141 3.86659 18.3987 4.07591 18.3987H13.4249C13.6343 18.3987 13.7992 18.3141 13.8937 18.2112C13.9797 18.1175 14.017 17.8611 13.9838 17.8611C13.7971 17.0608 13.4132 16.0881 12.6383 15.3208C11.8821 14.572 10.6899 13.955 8.75042 13.955C6.81096 13.955 5.61877 14.572 4.86252 15.3208Z"
        fill="currentColor">
      </path>

    </svg>`,

    boxIconLine: `<svg width="1em" height="1em" viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="text-gray-800 size-6 dark:text-white/90">

      <path fill-rule="evenodd" clip-rule="evenodd"
        d="M11.665 3.75621C11.8762 3.65064 12.1247 3.65064 12.3358 3.75621L18.7807 6.97856L12.3358 10.2009C12.1247 10.3065 11.8762 10.3065 11.665 10.2009L5.22014 6.97856L11.665 3.75621ZM4.29297 8.19203V16.0946C4.29297 16.3787 4.45347 16.6384 4.70757 16.7654L11.25 20.0366V11.6513C11.1631 11.6205 11.0777 11.5843 10.9942 11.5426L4.29297 8.19203ZM12.75 20.037L19.2933 16.7654C19.5474 16.6384 19.7079 16.3787 19.7079 16.0946V8.19202L13.0066 11.5426C12.9229 11.5844 12.8372 11.6208 12.75 11.6516V20.037Z"
        fill="currentColor">
      </path>

    </svg>`,

    arrowUpIcon: `<svg class="fill-current"
      width="1em"
      height="1em"
      viewBox="0 0 13 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">

      <path fill-rule="evenodd" clip-rule="evenodd"
        d="M6.06462 1.62393C6.20193 1.47072 6.40135 1.37432 6.62329 1.37432C6.81631 1.37415 7.00845 1.44731 7.15505 1.5938L10.1551 4.5918C10.4481 4.88459 10.4483 5.35946 10.1555 5.65246C9.86273 5.94546 9.38785 5.94562 9.09486 5.65283L7.37329 3.93247V10.125C7.37329 10.5392 7.03751 10.875 6.62329 10.875C6.20908 10.875 5.87329 10.5392 5.87329 10.125V3.93578L4.15516 5.65281C3.86218 5.94561 3.3873 5.94546 3.0945 5.65248C2.8017 5.35949 2.80185 4.88462 3.09484 4.59182L6.06462 1.62393Z"
        fill="">
      </path>

    </svg>`,

    arrowDownIcon: `<svg class="fill-current"
      width="1em"
      height="1em"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">

      <path fill-rule="evenodd" clip-rule="evenodd"
        d="M5.31462 10.3761C5.45194 10.5293 5.65136 10.6257 5.87329 10.6257C6.0663 10.6259 6.25845 10.5527 6.40505 10.4062L9.40514 7.4082C9.69814 7.11541 9.69831 6.64054 9.40552 6.34754C9.11273 6.05454 8.63785 6.05438 8.34486 6.34717L6.62329 8.06753V1.875C6.62329 1.46079 6.28751 1.125 5.87329 1.125C5.45908 1.125 5.12329 1.46079 5.12329 1.875V8.06422L3.40516 6.34719C3.11218 6.05439 2.6373 6.05454 2.3445 6.34752C2.0517 6.64051 2.05185 7.11538 2.34484 7.40818L5.31462 10.3761Z"
        fill="">
      </path>

    </svg>`
  };


  // =========================
  // INITIALISATION
  // =========================

  ngOnInit(): void {

    this.loadStatistics();

  }


  // =========================
  // CHARGEMENT
  // =========================

  loadStatistics(): void {

    this.loading = true;

    this.errorMessage = '';


    this.adminService.getUsers().subscribe({

      next: (users: UserAdminResponse[]) => {

        this.usersCount = users.length;

      },

      error: (error) => {

        console.error(
            'Erreur lors du chargement des utilisateurs:',
            error
        );

        this.errorMessage =
            'Impossible de charger les utilisateurs.';

      }

    });


    this.adminService.getProducts().subscribe({

      next: (products: ProductResponse[]) => {

        this.productsCount = products.length;

      },

      error: (error) => {

        console.error(
            'Erreur lors du chargement des produits:',
            error
        );

        this.errorMessage =
            'Impossible de charger les produits.';

      }

    });


    this.adminService.getOrders().subscribe({

      next: (orders: OrderResponse[]) => {

        this.ordersCount = orders.length;

        this.totalRevenue = orders.reduce(
            (total, order) =>
                total + Number(order.totalAmount || 0),
            0
        );

      },

      error: (error) => {

        console.error(
            'Erreur lors du chargement des commandes:',
            error
        );

        this.errorMessage =
            'Impossible de charger les commandes.';

      },

      complete: () => {

        this.loading = false;

      }

    });

  }


  // =========================
  // FORMATAGE
  // =========================

  formatCurrency(value: number): string {

    return new Intl.NumberFormat(
        'fr-FR',
        {
          style: 'currency',
          currency: 'XAF',
          maximumFractionDigits: 0
        }
    ).format(value);

  }

}