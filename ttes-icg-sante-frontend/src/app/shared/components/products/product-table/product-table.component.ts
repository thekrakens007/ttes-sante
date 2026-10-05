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

import {
    Product,
    ProductPage
} from '../../../../core/models/product.model';


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
export class ProductTableComponent implements OnInit {

    private productService = inject(ProductService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);


    // ============================================================
    // PRODUITS
    // ============================================================

    products: Product[] = [];

    loading = false;

    errorMessage = '';

    searchTerm = '';


    // ============================================================
    // PAGINATION
    // ============================================================

    currentPage = 0;

    pageSize = 12;

    totalPages = 0;

    totalElements = 0;

    pages: number[] = [];


    // ============================================================
    // SELECTION DES PRODUITS
    // ============================================================

    selectedProductIds = new Set<number>();


    // ============================================================
    // MODE SELECTION PACK
    // ============================================================

    isBundleSelectionMode = false;

    initialBundleProductIds: number[] = [];

    bundleReturnMode:
        'new' | 'edit' | null = null;

    bundleReturnId: number | null = null;


    // ============================================================
    // INITIALISATION
    // ============================================================

    ngOnInit(): void {

        this.route.queryParamMap.subscribe(params => {

            const bundleSelection =
                params.get('bundleSelection');


            const returnMode =
                params.get('returnMode');


            const bundleIdParam =
                params.get('bundleId');


            const productIdsParam =
                params.get('productIds');


            /*
             * ====================================================
             * MODE SELECTION PACK
             * ====================================================
             */

            if (
                bundleSelection === 'true'
            ) {

                this.isBundleSelectionMode =
                    true;


                /*
                 * Mode création / modification
                 */

                this.bundleReturnMode =
                    returnMode === 'edit'
                        ? 'edit'
                        : 'new';


                /*
                 * ID du pack si modification
                 */

                this.bundleReturnId =
                    bundleIdParam
                        ? Number(bundleIdParam)
                        : null;


                /*
                 * Produits déjà présents
                 */

                const productIds =
                    productIdsParam
                        ? this.parseProductIds(
                            productIdsParam
                        )
                        : [];


                this.initialBundleProductIds =
                    [...productIds];


                this.selectedProductIds =
                    new Set(productIds);


                this.loadProducts();

                return;
            }


            /*
             * ====================================================
             * MODE NORMAL
             * ====================================================
             */

            this.isBundleSelectionMode =
                false;


            this.bundleReturnMode =
                null;


            this.bundleReturnId =
                null;


            this.initialBundleProductIds =
                [];


            this.selectedProductIds =
                new Set();


            this.loadProducts();

        });

    }


    // ============================================================
    // CHARGEMENT
    // ============================================================

    loadProducts(): void {

        this.loading = true;

        this.errorMessage = '';


        const request =
            this.searchTerm.trim()

                ? this.productService.searchProductsPaginated(
                    this.searchTerm.trim(),
                    this.currentPage,
                    this.pageSize
                )

                : this.productService.getProductsPaginated(
                    this.currentPage,
                    this.pageSize
                );


        request.subscribe({

            next: (page: ProductPage) => {

                this.products =
                    page.content ?? [];


                this.totalPages =
                    page.totalPages ?? 0;


                this.totalElements =
                    page.totalElements ?? 0;


                this.currentPage =
                    page.number ??
                    this.currentPage;


                this.pageSize =
                    page.size ??
                    this.pageSize;


                this.buildPages();


                this.loading = false;

            },

            error: (err) => {

                console.error(
                    'Erreur chargement produits :',
                    err
                );


                this.errorMessage =
                    err?.error?.message ??
                    'Impossible de charger les produits.';


                this.loading = false;

            }

        });

    }


    // ============================================================
    // RECHERCHE
    // ============================================================

    submitSearch(): void {

        this.currentPage = 0;

        this.loadProducts();

    }


    onSearch(): void {

        this.submitSearch();

    }


    // ============================================================
    // PAGINATION
    // ============================================================

    buildPages(): void {

        this.pages =
            Array.from(
                {
                    length:
                        this.totalPages
                },
                (_, index) =>
                    index
            );

    }


    previousPage(): void {

        if (
            this.currentPage <= 0
        ) {

            return;

        }


        this.currentPage--;

        this.loadProducts();

    }


    nextPage(): void {

        if (
            this.currentPage >=
            this.totalPages - 1
        ) {

            return;

        }


        this.currentPage++;

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


        this.currentPage =
            page;

        this.loadProducts();

    }


    // ============================================================
    // SELECTION INDIVIDUELLE
    // ============================================================

    isProductSelected(
        productId: number
    ): boolean {

        return this.selectedProductIds.has(
            productId
        );

    }


    toggleProductSelection(
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


    // ============================================================
    // COMPTEUR
    // ============================================================

    get selectedProductCount(): number {

        return this.selectedProductIds.size;

    }


    get selectedCount(): number {

        return this.selectedProductIds.size;

    }


    // ============================================================
    // SELECTION DE LA PAGE
    // ============================================================

    selectAllVisible(): void {

        this.products.forEach(
            product => {

                this.selectedProductIds.add(
                    product.id
                );

            }
        );

    }


    deselectAllVisible(): void {

        this.products.forEach(
            product => {

                this.selectedProductIds.delete(
                    product.id
                );

            }
        );

    }


    selectAllCurrentPage(): void {

        this.selectAllVisible();

    }


    deselectAllCurrentPage(): void {

        this.deselectAllVisible();

    }


    // ============================================================
    // CREATION / MODIFICATION PACK
    // ============================================================

    continueToBundleCreation(): void {

        const productIds =
            Array.from(
                this.selectedProductIds
            );


        /*
         * --------------------------------------------------------
         * MODIFICATION D'UN PACK
         * --------------------------------------------------------
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
         * --------------------------------------------------------
         * CREATION D'UN NOUVEAU PACK
         * --------------------------------------------------------
         */

        this.router.navigate(
            [
                '/admin/bundles/new'
            ],
            {
                queryParams: {

                    productIds:
                        productIds.join(',')

                }
            }
        );

    }


    createBundle(): void {

        this.continueToBundleCreation();

    }


    confirmBundleSelection(): void {

        this.continueToBundleCreation();

    }


    navigateBackToBundle(): void {

        this.continueToBundleCreation();

    }


    // ============================================================
    // ANNULER LA SELECTION
    // ============================================================

    cancelBundleSelection(): void {

        /*
         * --------------------------------------------------------
         * MODIFICATION
         * --------------------------------------------------------
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
         * --------------------------------------------------------
         * CREATION
         * --------------------------------------------------------
         */

        this.router.navigate(
            [
                '/admin/bundles/new'
            ],
            {
                queryParams: {

                    productIds:
                        this.initialBundleProductIds.join(',')

                }
            }
        );

    }


    // ============================================================
    // SUPPRESSION
    // ============================================================

    deleteProduct(
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

        }

    }


    // ============================================================
    // IMAGE
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


        const main =
            product.images.find(
                image =>
                    image.main === true
            );


        if (
            main?.imageUrl
        ) {

            return main.imageUrl;

        }


        return product.images[0]?.imageUrl ??
            '';

    }


    // ============================================================
    // STOCK
    // ============================================================

    getStockClass(
        stock: number
    ): string {

        if (
            stock <= 0
        ) {

            return 'bg-red-100 text-red-700';

        }


        if (
            stock < 10
        ) {

            return 'bg-orange-100 text-orange-700';

        }


        return 'bg-green-100 text-green-700';

    }


    getStockLabel(
        stock: number
    ): string {

        if (
            stock <= 0
        ) {

            return 'Rupture';

        }


        if (
            stock < 10
        ) {

            return 'Stock faible';

        }


        return 'Disponible';

    }


    // ============================================================
    // UTILITAIRE
    // ============================================================

    private parseProductIds(
        value: string
    ): number[] {

        return value
            .split(',')
            .map(
                id =>
                    Number(id)
            )
            .filter(
                id =>
                    Number.isInteger(id) &&
                    id > 0
            );

    }

}
