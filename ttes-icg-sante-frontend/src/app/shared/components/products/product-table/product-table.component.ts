import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
    ActivatedRoute,
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
export class ProductTableComponent implements OnInit {

    private adminService = inject(AdminService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    products: Product[] = [];

    loading = true;
    errorMessage = '';

    searchTerm = '';

    currentPage = 0;
    pageSize = 8;
    totalPages = 0;
    totalElements = 0;
    pages: number[] = [];

    selectedProductIds = new Set<number>();

    // =========================================================
    // MODE SÉLECTION DE PRODUITS POUR UN PACK
    // =========================================================

    isBundleSelectionMode = false;

    /**
     * Sélection présente au moment où l'utilisateur
     * est entré dans le mode de sélection.
     *
     * Elle sert pour le bouton "Annuler / Retour au pack".
     */
    private initialBundleProductIds = new Set<number>();

    /**
     * Indique si nous devons revenir vers :
     * - /admin/bundles/new
     * - /admin/bundles/edit/:id
     */
    private bundleReturnMode: 'new' | 'edit' = 'new';

    /**
     * ID du pack en cours de modification.
     */
    private bundleReturnId: number | null = null;

    ngOnInit(): void {

        const params = this.route.snapshot.queryParamMap;

        // ---------------------------------------------------------
        // Détection du mode sélection de produits
        // ---------------------------------------------------------

        this.isBundleSelectionMode =
            params.get('bundleSelection') === 'true';

        if (this.isBundleSelectionMode) {

            const productIds = params
                .getAll('productIds')
                .map(value => Number(value))
                .filter(productId =>
                    Number.isInteger(productId) &&
                    productId > 0
                );

            const uniqueIds = [...new Set(productIds)];

            this.selectedProductIds =
                new Set(uniqueIds);

            this.initialBundleProductIds =
                new Set(uniqueIds);

            this.bundleReturnMode =
                params.get('returnMode') === 'edit'
                    ? 'edit'
                    : 'new';

            const bundleId = Number(
                params.get('bundleId')
            );

            if (
                Number.isInteger(bundleId) &&
                bundleId > 0
            ) {
                this.bundleReturnId = bundleId;
            }
        }

        this.loadProducts();
    }

    // =========================================================
    // SÉLECTION
    // =========================================================

    get selectedProductCount(): number {
        return this.selectedProductIds.size;
    }

    toggleProductSelection(productId: number): void {

        if (this.selectedProductIds.has(productId)) {

            this.selectedProductIds.delete(productId);

        } else {

            this.selectedProductIds.add(productId);
        }
    }

    isProductSelected(productId: number): boolean {
        return this.selectedProductIds.has(productId);
    }

    clearProductSelection(): void {
        this.selectedProductIds.clear();
    }

    // =========================================================
    // CHARGEMENT PRODUITS
    // =========================================================

    loadProducts(): void {

        this.loading = true;
        this.errorMessage = '';

        const keyword = this.searchTerm.trim();

        const request = keyword
            ? this.adminService.searchProductsPaginated(
                keyword,
                this.currentPage,
                this.pageSize
            )
            : this.adminService.getProductsPaginated(
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
    }

    previousPage(): void {

        if (this.currentPage > 0) {

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

    // =========================================================
    // CRÉATION D'UN PACK
    // =========================================================

    continueToBundleCreation(): void {

        const productIds =
            Array.from(this.selectedProductIds);

        if (productIds.length === 0) {
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

    // =========================================================
    // MODE SÉLECTION PACK
    // =========================================================

    /**
     * Annule les changements effectués depuis
     * l'entrée dans le mode sélection.
     */
    cancelBundleSelection(): void {

        const productIds =
            Array.from(
                this.initialBundleProductIds
            );

        this.navigateBackToBundle(
            productIds
        );
    }

    /**
     * Confirme la sélection actuelle.
     */
    confirmBundleSelection(): void {

        const productIds =
            Array.from(
                this.selectedProductIds
            );

        if (productIds.length === 0) {
            return;
        }

        this.navigateBackToBundle(
            productIds
        );
    }

    /**
     * Retour vers le formulaire du pack.
     *
     * IMPORTANT :
     * - modification → /admin/bundles/edit/:id
     * - création → /admin/bundles/new
     */
    private navigateBackToBundle(
        productIds: number[]
    ): void {

        if (
            this.bundleReturnMode === 'edit' &&
            this.bundleReturnId !== null
        ) {

            this.router.navigate(
                [
                    '/admin/bundles/edit',
                    this.bundleReturnId
                ],
                {
                    queryParams: {
                        productIds
                    }
                }
            );

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

    // =========================================================
    // PRODUITS
    // =========================================================

    getMainImage(product: Product): string {

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

    getStockLabel(stock: number): string {

        if (stock <= 0) {
            return 'Rupture';
        }

        if (stock < 10) {
            return 'Stock faible';
        }

        return 'En stock';
    }

    // =========================================================
    // SUPPRESSION
    // =========================================================

    deleteProduct(productId: number): void {

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

                    this.initialBundleProductIds
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
