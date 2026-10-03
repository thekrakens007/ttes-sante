import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    Router,
    RouterModule
} from '@angular/router';

import { BadgeComponent } from '../../ui/badge/badge.component';
import { AdminService } from '../../../../core/services/admin.service';
import { Product } from '../../../../core/models/product.model';


@Component({
    selector: 'app-product-table',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        BadgeComponent,
        RouterModule
    ],
    templateUrl: './product-table.component.html'
})
export class ProductTableComponent
    implements OnInit {

    private adminService =
        inject(AdminService);

    private router =
        inject(Router);


    // ============================================================
    // PRODUITS
    // ============================================================

    products: Product[] = [];


    // ============================================================
    // ETAT
    // ============================================================

    loading = true;

    errorMessage = '';


    // ============================================================
    // RECHERCHE
    // ============================================================

    searchTerm = '';


    // ============================================================
    // PAGINATION
    // ============================================================

    currentPage = 0;

    pageSize = 8;

    totalPages = 0;

    totalElements = 0;

    pages: number[] = [];


    // ============================================================
    // SELECTION POUR PACK
    // ============================================================

    selectedProductIds =
        new Set<number>();


    // ============================================================
    // INIT
    // ============================================================

    ngOnInit(): void {

        this.loadProducts();

    }


    // ============================================================
    // NOMBRE PRODUITS SELECTIONNES
    // ============================================================

    get selectedProductCount(): number {

        return this.selectedProductIds.size;

    }


    // ============================================================
    // CHARGEMENT PRODUITS
    // ============================================================

    loadProducts(): void {

        this.loading = true;

        this.errorMessage = '';


        const keyword =
            this.searchTerm.trim();


        const request = keyword

            ? this.adminService
                .searchProductsPaginated(
                    keyword,
                    this.currentPage,
                    this.pageSize
                )

            : this.adminService
                .getProductsPaginated(
                    this.currentPage,
                    this.pageSize
                );


        request.subscribe({

            next: (response: any) => {

                this.products =
                    response.content ?? [];

                this.totalPages =
                    response.totalPages ?? 0;

                this.totalElements =
                    response.totalElements ?? 0;

                this.generatePages();

                this.loading = false;

            },

            error: (error) => {

                console.error(
                    'Erreur chargement produits :',
                    error
                );

                this.errorMessage =
                    'Impossible de charger les produits.';

                this.products = [];

                this.loading = false;

            }

        });

    }


    // ============================================================
    // PAGINATION
    // ============================================================

    generatePages(): void {

        this.pages = [];

        for (
            let i = 0;
            i < this.totalPages;
            i++
        ) {

            this.pages.push(i);

        }

    }


    submitSearch(): void {

        this.currentPage = 0;

        this.loadProducts();

    }


    goToPage(
        page: number
    ): void {

        if (
            page < 0 ||
            page >= this.totalPages ||
            page === this.currentPage
        ) {
            return;
        }


        this.currentPage = page;

        this.loadProducts();

    }


    previousPage(): void {

        if (
            this.currentPage > 0
        ) {

            this.currentPage--;

            this.loadProducts();

        }

    }


    nextPage(): void {

        if (
            this.currentPage <
            this.totalPages - 1
        ) {

            this.currentPage++;

            this.loadProducts();

        }

    }


    // ============================================================
    // SELECTION
    // ============================================================

    toggleProductSelection(
        productId: number
    ): void {

        if (
            this.selectedProductIds
                .has(productId)
        ) {

            this.selectedProductIds
                .delete(productId);

        }
        else {

            this.selectedProductIds
                .add(productId);

        }

    }


    isProductSelected(
        productId: number
    ): boolean {

        return this.selectedProductIds
            .has(productId);

    }


    clearProductSelection(): void {

        this.selectedProductIds.clear();

    }


    // ============================================================
    // CREATION PACK
    // ============================================================

    continueToBundleCreation(): void {

        const productIds =
            Array.from(
                this.selectedProductIds
            );


        if (
            productIds.length === 0
        ) {
            return;
        }


        this.router.navigate(
            ['/admin/bundles/new'],
            {
                queryParams: {
                    productIds
                }
            }
        );

    }


    // ============================================================
    // IMAGE PRINCIPALE
    // ============================================================

    getMainImage(
        product: Product
    ): string {

        if (
            !product.images ||
            product.images.length === 0
        ) {

            return '';

        }


        const mainImage =
            product.images.find(
                image => image.main
            );


        return (
            mainImage?.imageUrl ??
            product.images[0]?.imageUrl ??
            ''
        );

    }


    // ============================================================
    // STOCK
    // ============================================================

    getStockColor(
        stock: number
    ): 'success' | 'warning' | 'error' {

        if (stock <= 0) {

            return 'error';

        }


        if (stock < 10) {

            return 'warning';

        }


        return 'success';

    }


    getStockLabel(
        stock: number
    ): string {

        if (stock <= 0) {

            return 'Rupture';

        }


        if (stock < 10) {

            return 'Stock faible';

        }


        return 'En stock';

    }


    // ============================================================
    // SUPPRESSION PRODUIT
    // ============================================================

    deleteProduct(
        productId: number
    ): void {

        if (
            !confirm(
                'Êtes-vous sûr de vouloir supprimer ce produit ?'
            )
        ) {

            return;

        }


        this.adminService
            .deleteProduct(productId)
            .subscribe({

                next: () => {

                    this.selectedProductIds
                        .delete(productId);

                    this.loadProducts();

                },

                error: (error) => {

                    console.error(
                        'Erreur suppression produit :',
                        error
                    );

                    this.errorMessage =
                        'Impossible de supprimer le produit.';

                }

            });

    }

}
