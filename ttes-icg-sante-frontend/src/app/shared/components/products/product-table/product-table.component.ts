import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BadgeComponent } from '../../ui/badge/badge.component';
import { AdminService } from '../../../../core/services/admin.service';
import { ProductResponse } from '../../../../core/interfaces/product-response.interface';
import {RouterModule} from "@angular/router";

@Component({
    selector: 'app-product-table',
    imports: [
        CommonModule,
        BadgeComponent,
        RouterModule,
    ],
    templateUrl: './product-table.component.html'
})
export class ProductTableComponent implements OnInit {

    private adminService = inject(AdminService);

    products: ProductResponse[] = [];

    loading = true;
    errorMessage = '';

    ngOnInit(): void {
        this.loadProducts();
    }

    loadProducts(): void {

        this.loading = true;
        this.errorMessage = '';

        this.adminService.getProducts().subscribe({

            next: (products) => {

                this.products = products;
                this.loading = false;

            },

            error: (error) => {

                console.error(
                    'Erreur lors du chargement des produits:',
                    error
                );

                this.errorMessage =
                    'Impossible de charger les produits.';

                this.loading = false;

            }

        });
    }

    getMainImage(product: ProductResponse): string {

        if (!product.images || product.images.length === 0) {
            return '/images/product/product-01.jpg';
        }

        const mainImage = product.images.find(
            image => image.main
        );

        return mainImage?.imageUrl
            || product.images[0].imageUrl
            || '/images/product/product-01.jpg';
    }

    getStockColor(
        stock: number
    ): 'success' | 'warning' | 'error' {

        if (stock <= 0) {
            return 'error';
        }

        if (stock <= 10) {
            return 'warning';
        }

        return 'success';
    }

    getStockLabel(stock: number): string {

        if (stock <= 0) {
            return 'Rupture';
        }

        if (stock <= 10) {
            return 'Stock faible';
        }

        return 'Disponible';
    }

}