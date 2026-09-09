import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { BadgeComponent } from '../../ui/badge/badge.component';
import { AdminService } from '../../../../core/services/admin.service';
import { Product } from '../../../../core/models/product.model';

@Component({
    selector: 'app-product-table',
    imports: [
        CommonModule,
        BadgeComponent,
        RouterModule
    ],
    templateUrl: './product-table.component.html'
})
export class ProductTableComponent implements OnInit {

    private adminService = inject(AdminService);

    // =========================
    // PRODUCTS
    // =========================

    products: Product[] = [];

    // =========================
    // LOADING / ERROR
    // =========================

    loading = true;

    errorMessage = '';

    // =========================
    // PAGINATION
    // =========================

    currentPage = 0;

    pageSize = 8;

    totalPages = 0;

    totalElements = 0;

    pages: number[] = [];

    // =========================
    // INIT
    // =========================

    ngOnInit(): void {
        this.loadProducts();
    }

    // =========================
    // LOAD PRODUCTS
    // =========================

    loadProducts(): void {

        this.loading = true;

        this.errorMessage = '';

        this.adminService
            .getProductsPaginated(
                this.currentPage,
                this.pageSize
            )
            .subscribe({

                next: (response) => {

                    this.products = response.content;

                    this.totalPages = response.totalPages;

                    this.totalElements = response.totalElements;

                    this.pages = Array.from(
                        {
                            length: this.totalPages
                        },
                        (_, index) => index
                    );

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

    // =========================
    // REFRESH
    // =========================

    refreshProducts(): void {

        this.loadProducts();

    }

    // =========================
    // DELETE PRODUCT
    // =========================

    deleteProduct(productId: number): void {

        const confirmed = confirm(
            'Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.'
        );

        if (!confirmed) {
            return;
        }

        this.adminService
            .deleteProduct(productId)
            .subscribe({

                next: () => {

                    console.log(
                        'Produit supprimé avec succès :',
                        productId
                    );

                    if (
                        this.products.length === 1 &&
                        this.currentPage > 0
                    ) {

                        this.currentPage--;

                    }

                    this.loadProducts();

                },

                error: (error) => {

                    console.error(
                        'Erreur lors de la suppression du produit :',
                        error
                    );

                    this.errorMessage =
                        error?.error?.message
                        ?? 'Impossible de supprimer le produit.';

                }

            });

    }

    // =========================
    // MAIN IMAGE
    // =========================

    getMainImage(
        product: Product
    ): string {

        if (
            !product.images ||
            product.images.length === 0
        ) {

            return '/images/product/product-01.jpg';

        }

        const mainImage =
            product.images.find(
                image => image.main
            );

        return (
            mainImage?.imageUrl
            ||
            product.images[0].imageUrl
            ||
            '/images/product/product-01.jpg'
        );

    }

    // =========================
    // STOCK COLOR
    // =========================

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

    // =========================
    // STOCK LABEL
    // =========================

    getStockLabel(
        stock: number
    ): string {

        if (stock <= 0) {
            return 'Rupture';
        }

        if (stock <= 10) {
            return 'Stock faible';
        }

        return 'Disponible';

    }

    // =========================
    // PAGINATION
    // =========================

    goToPage(page: number): void {

        if (
            page < 0 ||
            page >= this.totalPages ||
            page === this.currentPage
        ) {

            return;

        }

        this.currentPage = page;

        this.loadProducts();

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

    }

    // =========================
    // NEXT PAGE
    // =========================

    nextPage(): void {

        if (
            this.currentPage <
            this.totalPages - 1
        ) {

            this.currentPage++;

            this.loadProducts();

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

        }

    }

    // =========================
    // PREVIOUS PAGE
    // =========================

    previousPage(): void {

        if (this.currentPage > 0) {

            this.currentPage--;

            this.loadProducts();

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

        }

    }

}