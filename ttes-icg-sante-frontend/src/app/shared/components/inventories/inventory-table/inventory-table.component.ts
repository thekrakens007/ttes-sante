import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { RouterModule } from '@angular/router';

import { AdminService } from '../../../../core/services/admin.service';

import { InventoryResponse } from '../../../../core/interfaces/inventory-response.interface';


@Component({
    selector: 'app-inventory-table',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule
    ],
    templateUrl: './inventory-table.component.html'
})
export class InventoryTableComponent
    implements OnInit {

    private adminService =
        inject(AdminService);

    inventories: InventoryResponse[] = [];

    loading = false;

    errorMessage = '';


    ngOnInit(): void {

        this.loadInventories();

    }


    loadInventories(): void {

        /*
         * Pour l'instant notre backend InventoryService
         * possède findByProductId().
         *
         * Il nous faut donc récupérer les produits
         * puis leur stock.
         */

        this.loading = true;

        this.adminService
            .getProducts()
            .subscribe({

                next: products => {

                    this.inventories = [];

                    if (products.length === 0) {

                        this.loading = false;

                        return;

                    }

                    let completed = 0;

                    products.forEach(product => {

                        this.adminService
                            .getInventory(product.id)
                            .subscribe({

                                next: inventory => {

                                    this.inventories.push(
                                        inventory
                                    );

                                    completed++;

                                    if (
                                        completed ===
                                        products.length
                                    ) {

                                        this.loading = false;

                                    }

                                },

                                error: error => {

                                    console.error(
                                        'Erreur stock produit',
                                        product.id,
                                        error
                                    );

                                    completed++;

                                    if (
                                        completed ===
                                        products.length
                                    ) {

                                        this.loading = false;

                                    }

                                }

                            });

                    });

                },

                error: error => {

                    console.error(error);

                    this.errorMessage =
                        'Impossible de charger les produits.';

                    this.loading = false;

                }

            });

    }


    refresh(): void {

        this.loadInventories();

    }

}