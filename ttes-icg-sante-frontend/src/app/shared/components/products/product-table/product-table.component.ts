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

import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/models/product.model';


@Component({
    selector: 'app-product-table',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule
    ],
    templateUrl: './product-table.component.html'
})
export class ProductTableComponent
    implements OnInit {

    private productService =
        inject(ProductService);

    private route =
        inject(ActivatedRoute);

    private router =
        inject(Router);


    products: Product[] = [];

    loading = false;

    searchTerm = '';

    currentPage = 0;

    pageSize = 12;

    totalPages = 0;

    totalElements = 0;


    /*
     * Produits sélectionnés.
     *
     * Le Set permet de conserver la sélection
     * même lorsqu'on change de page.
     */

    selectedProductIds =
        new Set<number>();


    /*
     * Mode sélection pour un pack.
     */

    isBundleSelectionMode = false;

    initialBundleProductIds: number[] = [];

    bundleReturnMode:
        'new' | 'edit' | null = null;

    bundleReturnId:
        number | null = null;


    ngOnInit(): void {

        this.route.queryParamMap.subscribe(params => {

            this.isBundleSelectionMode =
                params.get('bundleSelection') === 'true';


            if (!this.isBundleSelectionMode) {

                this.loadProducts();

                return;
            }


            /*
             * Mode création / édition.
             */

            const returnMode =
                params.get('returnMode');


            if (
                returnMode === 'edit'
            ) {

                this.bundleReturnMode =
                    'edit';

            } else {

                this.bundleReturnMode =
                    'new';

            }


            const bundleId =
                params.get('bundleId');


            this.bundleReturnId =
                bundleId
                    ? Number(bundleId)
                    : null;


            const productIdsParam =
                params.get('productIds');


            const ids =
                productIdsParam
                    ? this.parseProductIds(
                        productIdsParam
                    )
                    : [];


            /*
             * Mémoriser l'état initial.
             *
             * Cela permet à "Annuler"
             * de revenir à la sélection précédente.
             */

            this.initialBundleProductIds =
                [...ids];


            this.selectedProductIds =
                new Set(ids);


            this.loadProducts();

        });

    }


    /*
     * ============================================================
     * PRODUITS
     * ============================================================
     */

    loadProducts(): void {

        this.loading = true;


        const request =
            this.searchTerm.trim()
                ? this.productService.searchProductsPaginated(
                    this.searchTerm,
                    this.currentPage,
                    this.pageSize
                )
                : this.productService.getProductsPaginated(
                    this.currentPage,
                    this.pageSize
                );


        request.subscribe({

            next: page => {

                this.products =
                    page.content ?? [];

                this.totalPages =
                    page.totalPages ?? 0;

                this.totalElements =
                    page.totalElements ?? 0;

                this.loading = false;

            },

            error: err => {

                console.error(
                    'Erreur chargement produits :',
                    err
                );

                this.loading = false;

            }

        });

    }


    onSearch(): void {

        this.currentPage = 0;

        this.loadProducts();

    }


    goToPage(
        page: number
    ): void {

        if (
            page < 0 ||
            page >= this.totalPages
        ) {
            return;
        }


        this.currentPage = page;

        this.loadProducts();

    }


    /*
     * ============================================================
     * SELECTION
     * ============================================================
     */

    isSelected(
        productId: number
    ): boolean {

        return this.selectedProductIds.has(
            productId
        );

    }


    toggleProduct(
        productId: number
    ): void {

        if (
            this.selectedProductIds.has(
                productId
            )
        ) {

            this.selectedProductIds.delete(
                productId
            );

        } else {

            this.selectedProductIds.add(
                productId
            );

        }

    }


    selectAllCurrentPage(): void {

        this.products.forEach(
            product => {

                this.selectedProductIds.add(
                    product.id
                );

            }
        );

    }


    deselectAllCurrentPage(): void {

        this.products.forEach(
            product => {

                this.selectedProductIds.delete(
                    product.id
                );

            }
        );

    }


    get selectedProductCount(): number {
    return this.selectedProductIds.size;
}

get selectedCount(): number {
    return this.selectedProductIds.size;
}


    /*
     * ============================================================
     * CREER UN PACK
     * ============================================================
     */

    createBundle(): void {

        const productIds =
            Array.from(
                this.selectedProductIds
            );


        this.router.navigate(
            ['/admin/bundles/new'],
            {
                queryParams: {
                    productIds:
                        productIds.join(',')
                }
            }
        );

    }


    /*
     * ============================================================
     * CONFIRMER SELECTION
     * ============================================================
     */

    confirmBundleSelection(): void {

        const productIds =
            Array.from(
                this.selectedProductIds
            );


        /*
         * EDITION
         *
         * On retourne obligatoirement
         * vers /edit/:id.
         */

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
                        productIds:
                            productIds.join(',')
                    }
                }
            );

            return;
        }


        /*
         * CREATION
         */

        this.router.navigate(
            ['/admin/bundles/new'],
            {
                queryParams: {
                    productIds:
                        productIds.join(',')
                }
            }
        );

    }


    /*
     * ============================================================
     * ANNULER LA SELECTION
     * ============================================================
     */

    cancelBundleSelection(): void {

        /*
         * Restaurer exactement les produits
         * présents avant d'entrer dans le mode
         * sélection.
         */

        this.selectedProductIds =
            new Set(
                this.initialBundleProductIds
            );


        /*
         * Retour vers le pack en édition.
         */

        if (
            this.bundleReturnMode === 'edit' &&
            this.bundleReturnId !== null
        ) {

            this.router.navigate(
                [
                    '/admin/bundles/edit',
                    this.bundleReturnId
                ]
            );

            return;
        }


        /*
         * Retour création.
         */

        this.router.navigate(
            ['/admin/bundles/new'],
            {
                queryParams: {
                    productIds:
                        this.initialBundleProductIds.join(',')
                }
            }
        );

    }


    /*
     * ============================================================
     * RETOUR AU PACK
     * ============================================================
     */

    navigateBackToBundle(): void {

        const productIds =
            Array.from(
                this.selectedProductIds
            );


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
                        productIds:
                            productIds.join(',')
                    }
                }
            );

            return;
        }


        this.router.navigate(
            ['/admin/bundles/new'],
            {
                queryParams: {
                    productIds:
                        productIds.join(',')
                }
            }
        );

    }


    /*
     * ============================================================
     * OUTILS
     * ============================================================
     */

    private parseProductIds(
        value: string
    ): number[] {

        return value
            .split(',')
            .map(id => Number(id))
            .filter(
                id =>
                    Number.isInteger(id) &&
                    id > 0
            );

    }


    getMainImage(
        product: Product
    ): string {

        if (!product.images?.length) {
            return '';
        }


        const main =
            product.images.find(
                image => image.main
            );


        return main?.imageUrl ??
            product.images[0]?.imageUrl ??
            '';

    }


    getStockClass(
        stock: number
    ): string {

        if (stock <= 0) {

            return 'bg-red-100 text-red-700';

        }


        if (stock < 10) {

            return 'bg-orange-100 text-orange-700';

        }


        return 'bg-green-100 text-green-700';

    }


    getStockLabel(
        stock: number
    ): string {

        if (stock <= 0) {
            return 'Rupture';
        }


        if (stock < 10) {
            return 'Faible';
        }


        return 'Disponible';

    }

}
