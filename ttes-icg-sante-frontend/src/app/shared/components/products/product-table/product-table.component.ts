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
    // SELECTION PRODUITS
    // ============================================================

    selectedProductIds = new Set<number>();


    // ============================================================
    // MODE CREATION / MODIFICATION PACK
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

            this.isBundleSelectionMode =
                params.get('bundleSelection') === 'true';


            /*
             * Mode normal :
             * simple liste des produits.
             */

            if (!this.isBundleSelectionMode) {

                this.bundleReturnMode = null;

                this.bundleReturnId = null;

                this.loadProducts();

                return;
            }


            /*
             * Mode sélection pour un pack.
             */

            const returnMode =
                params.get('returnMode');


            if (returnMode === 'edit') {

                this.bundleReturnMode = 'edit';

            } else {

                this.bundleReturnMode = 'new';

            }


            const bundleId =
                params.get('bundleId');


            this.bundleReturnId =
                bundleId
                    ? Number(bundleId)
                    : null;


            /*
             * Produits déjà présents dans le pack.
             */

            const productIdsParam =
                params.get('productIds');


            const productIds =
                productIdsParam
                    ? this.parseProductIds(
                        productIdsParam
                    )
                    : [];


            /*
             * On mémorise la sélection initiale.
             *
             * Cela permet à "Annuler" de restaurer
             * exactement la sélection précédente.
             */

            this.initialBundleProductIds =
                [...productIds];


            this.selectedProductIds =
                new Set(productIds);


            this.loadProducts();

        });

    }


    // ============================================================
    // CHARGEMENT DES PRODUITS
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
                    page.number ?? this.currentPage;

                this.pageSize =
                    page.size ?? this.pageSize;


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
                    length: this.totalPages
                },
                (_, index) => index
            );

    }


    previousPage(): void {

        if (this.currentPage <= 0) {
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


    goToPage(page: number): void {

        if (
            page < 0 ||
            page >= this.totalPages
        ) {
            return;
        }


        this.currentPage = page;

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

    }


    get selectedProductCount(): number {

        return this.selectedProductIds.size;

    }


    get selectedCount(): number {

        return this.selectedProductIds.size;

    }


    // ============================================================
    // SELECTION DE LA PAGE ACTUELLE
    // ============================================================

    selectAllVisible(): void {

        this.products.forEach(product => {

            this.selectedProductIds.add(
                product.id
            );

        });

    }


    deselectAllVisible(): void {

        this.products.forEach(product => {

            this.selectedProductIds.delete(
                product.id
            );

        });

    }


    // Compatibilité éventuelle
    selectAllCurrentPage(): void {

        this.selectAllVisible();

    }


    deselectAllCurrentPage(): void {

        this.deselectAllVisible();

    }


    // ============================================================
    // CREATION D'UN PACK
    // ============================================================

    continueToBundleCreation(): void {

        const productIds =
            Array.from(
                this.selectedProductIds
            );


        /*
         * Si nous sommes déjà dans le flux
         * d'édition d'un pack, il faut revenir
         * à CE pack.
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
         * Sinon nous sommes dans une création.
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


    createBundle(): void {

        this.continueToBundleCreation();

    }


    // ============================================================
    // CONFIRMATION SELECTION PACK
    // ============================================================

    confirmBundleSelection(): void {

        this.continueToBundleCreation();

    }


    // ============================================================
    // ANNULATION SELECTION PACK
    // ============================================================

    cancelBundleSelection(): void {

        /*
         * On restaure la sélection qui existait
         * AVANT l'ouverture du sélecteur.
         */

        this.selectedProductIds =
            new Set(
                this.initialBundleProductIds
            );


        /*
         * EDITION
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
         * CREATION
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


    // ============================================================
    // RETOUR AU PACK
    // ============================================================

    navigateBackToBundle(): void {

        this.continueToBundleCreation();

    }


    // ============================================================
    // SUPPRESSION PRODUIT
    // ============================================================

    deleteProduct(
        productId: number
    ): void {

        /*
         * IMPORTANT :
         * Je ne lance pas ici un DELETE backend sans connaître
         * la méthode exacte de ton AdminService.
         *
         * Cette méthode retire au minimum le produit
         * de la sélection du pack.
         */

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
    // IMAGES
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
                image => image.main === true
            );


        if (main?.imageUrl) {

            return main.imageUrl;

        }


        return product.images[0]?.imageUrl ?? '';

    }


    // ============================================================
    // STOCK
    // ============================================================

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

            return 'Stock faible';

        }


        return 'Disponible';

    }


    // ============================================================
    // UTILITAIRE IDS
    // ============================================================

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

}
