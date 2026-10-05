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
    // SELECTION
    // ============================================================

    selectedProductIds = new Set<number>();


    // ============================================================
    // MODE PACK
    // ============================================================

    isBundleSelectionMode = false;

    initialBundleProductIds: number[] = [];

    bundleReturnMode:
        'new' | 'edit' | null = null;

    bundleReturnId: number | null = null;


    // ============================================================
    // STOCKAGE DU CONTEXTE
    // ============================================================

    private readonly SELECTION_CONTEXT_KEY =
        'ttes_bundle_selection_context';


    // ============================================================
    // INITIALISATION
    // ============================================================

    ngOnInit(): void {

        this.route.queryParamMap.subscribe(params => {

            /*
             * ====================================================
             * RECUPERATION DES PARAMETRES URL
             * ====================================================
             */

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
             * CAS 1 :
             *
             * On arrive directement avec :
             *
             * ?bundleSelection=true
             * ====================================================
             */

            if (
                bundleSelection === 'true'
            ) {

                this.isBundleSelectionMode =
                    true;


                /*
                 * Mode retour.
                 */

                this.bundleReturnMode =
                    returnMode === 'edit'
                        ? 'edit'
                        : 'new';


                /*
                 * ID du pack en modification.
                 */

                this.bundleReturnId =
                    bundleIdParam
                        ? Number(bundleIdParam)
                        : null;


                /*
                 * Produits déjà sélectionnés.
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


                /*
                 * On sauvegarde le contexte.
                 */

                this.saveSelectionContext();


                /*
                 * Recharger les produits.
                 */

                this.loadProducts();

                return;
            }


            /*
             * ====================================================
             * CAS 2 :
             *
             * L'URL ne contient plus bundleSelection=true,
             * mais Angular a conservé/rechargé la page.
             *
             * On tente de récupérer le contexte.
             * ====================================================
             */

            const context =
                this.getSelectionContext();


            if (
                context &&
                context.isBundleSelectionMode
            ) {

                this.isBundleSelectionMode =
                    true;


                this.bundleReturnMode =
                    context.bundleReturnMode;


                this.bundleReturnId =
                    context.bundleReturnId;


                this.initialBundleProductIds =
                    [...context.initialBundleProductIds];


                this.selectedProductIds =
                    new Set(
                        context.selectedProductIds
                    );


                this.loadProducts();

                return;
            }


            /*
             * ====================================================
             * MODE NORMAL
             * ====================================================
             */

            this.resetSelectionContext();

            this.isBundleSelectionMode =
                false;

            this.bundleReturnMode =
                null;

            this.bundleReturnId =
                null;

            this.selectedProductIds =
                new Set();

            this.loadProducts();

        });

    }


    // ============================================================
    // CHARGEMENT PRODUITS
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
    // SELECTION
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


        /*
         * Sauvegarder immédiatement la sélection.
         *
         * Ainsi elle survit à une recherche,
         * une pagination ou un retour navigateur.
         */

        this.saveSelectionContext();

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
    // SELECTION PAGE ACTUELLE
    // ============================================================

    selectAllVisible(): void {

        this.products.forEach(
            product => {

                this.selectedProductIds.add(
                    product.id
                );

            }
        );


        this.saveSelectionContext();

    }


    deselectAllVisible(): void {

        this.products.forEach(
            product => {

                this.selectedProductIds.delete(
                    product.id
                );

            }
        );


        this.saveSelectionContext();

    }


    selectAllCurrentPage(): void {

        this.selectAllVisible();

    }


    deselectAllCurrentPage(): void {

        this.deselectAllVisible();

    }


    // ============================================================
    // CREER / MODIFIER UN PACK
    // ============================================================

    continueToBundleCreation(): void {

        const productIds =
            Array.from(
                this.selectedProductIds
            );


        /*
         * ========================================================
         * MODIFICATION
         * ========================================================
         */

        if (
            this.bundleReturnMode === 'edit' &&
            this.bundleReturnId !== null
        ) {

            /*
             * IMPORTANT :
             *
             * On conserve l'ID du pack.
             */

            const bundleId =
                this.bundleReturnId;


            this.resetSelectionContext();


            this.router.navigate(
                [
                    '/admin/bundles/edit',
                    bundleId
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
         * ========================================================
         * CREATION
         * ========================================================
         */

        this.resetSelectionContext();


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
    // ANNULATION
    // ============================================================

    cancelBundleSelection(): void {

        /*
         * Restaurer la sélection initiale.
         */

        const initialIds =
            [
                ...this.initialBundleProductIds
            ];


        /*
         * ========================================================
         * EDITION
         * ========================================================
         */

        if (
            this.bundleReturnMode === 'edit' &&
            this.bundleReturnId !== null
        ) {

            const bundleId =
                this.bundleReturnId;


            this.resetSelectionContext();


            this.router.navigate(
                [
                    '/admin/bundles/edit',
                    bundleId
                ]
            );


            return;
        }


        /*
         * ========================================================
         * CREATION
         * ========================================================
         */

        this.resetSelectionContext();


        this.router.navigate(
            [
                '/admin/bundles/new'
            ],
            {
                queryParams: {

                    productIds:
                        initialIds.join(',')

                }
            }
        );

    }


    // ============================================================
    // SUPPRESSION PRODUIT
    // ============================================================

    deleteProduct(
        productId: number
    ): void {

        /*
         * Dans le mode sélection pack,
         * cette action retire simplement le produit
         * de la sélection.
         */

        if (
            this.selectedProductIds.has(
                productId
            )
        ) {

            this.selectedProductIds.delete(
                productId
            );

            this.saveSelectionContext();

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
    // CONTEXTE SELECTION
    // ============================================================

    private saveSelectionContext(): void {

        /*
         * Ne rien sauvegarder si nous sommes dans
         * le mode normal.
         */

        if (
            !this.isBundleSelectionMode
        ) {

            return;

        }


        const context = {

            isBundleSelectionMode:
                true,

            bundleReturnMode:
                this.bundleReturnMode,

            bundleReturnId:
                this.bundleReturnId,

            initialBundleProductIds:
                [
                    ...this.initialBundleProductIds
                ],

            selectedProductIds:
                Array.from(
                    this.selectedProductIds
                )

        };


        sessionStorage.setItem(
            this.SELECTION_CONTEXT_KEY,
            JSON.stringify(context)
        );

    }


    private getSelectionContext(): {
        isBundleSelectionMode: boolean;
        bundleReturnMode:
            'new' | 'edit' | null;
        bundleReturnId: number | null;
        initialBundleProductIds: number[];
        selectedProductIds: number[];
    } | null {

        try {

            const raw =
                sessionStorage.getItem(
                    this.SELECTION_CONTEXT_KEY
                );


            if (!raw) {

                return null;

            }


            const data =
                JSON.parse(raw);


            if (
                !data?.isBundleSelectionMode
            ) {

                return null;

            }


            return {

                isBundleSelectionMode:
                    true,

                bundleReturnMode:
                    data.bundleReturnMode === 'edit'
                        ? 'edit'
                        : 'new',

                bundleReturnId:
                    data.bundleReturnId
                        ? Number(
                            data.bundleReturnId
                        )
                        : null,

                initialBundleProductIds:
                    Array.isArray(
                        data.initialBundleProductIds
                    )
                        ? data.initialBundleProductIds
                        : [],

                selectedProductIds:
                    Array.isArray(
                        data.selectedProductIds
                    )
                        ? data.selectedProductIds
                        : []

            };

        } catch (error) {

            console.error(
                'Erreur lecture contexte sélection :',
                error
            );

            return null;

        }

    }


    private resetSelectionContext(): void {

        sessionStorage.removeItem(
            this.SELECTION_CONTEXT_KEY
        );

    }


    // ============================================================
    // UTILITAIRE IDS
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
