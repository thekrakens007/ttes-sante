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

    /**
     * Contient toujours les produits actuellement sélectionnés.
     *
     * En mode normal :
     * -> produits sélectionnés pour créer un nouveau pack ou une cure.
     *
     * En mode sélection (depuis un pack ou une cure) :
     * -> produits actuellement sélectionnés dans le pack / la cure.
     */
    selectedProductIds = new Set<number>();


    // ============================================================
    // MODE SELECTION DEPUIS UN PACK OU UNE CURE
    // ============================================================

    isBundleSelectionMode = false;

    /**
     * Formulaire d'origine : pack ou cure.
     */
    returnTarget: 'bundle' | 'cure' = 'bundle';

    /**
     * Sélection présente AVANT d'ouvrir le sélecteur
     * depuis le formulaire du pack / de la cure.
     *
     * Utilisée uniquement pour "Annuler".
     */
    initialBundleProductIds: number[] = [];

    bundleReturnMode:
        'new' | 'edit' | null = null;

    /**
     * Id du pack ou de la cure en modification.
     */
    bundleReturnId: number | null = null;


    // ============================================================
    // LIBELLES DYNAMIQUES
    // ============================================================

    get targetOfLabel(): string {

        return this.returnTarget === 'cure'
            ? 'de la cure'
            : 'du pack';

    }


    get targetToLabel(): string {

        return this.returnTarget === 'cure'
            ? 'à la cure'
            : 'au pack';

    }


    get targetInLabel(): string {

        return this.returnTarget === 'cure'
            ? 'dans la cure'
            : 'dans le pack';

    }


    // ============================================================
    // INITIALISATION
    // ============================================================

    ngOnInit(): void {

        this.route.queryParamMap.subscribe(params => {

            /*
             * ====================================================
             * Vérification du mode sélection depuis un pack / cure
             * ====================================================
             */

            const bundleSelection =
                params.get('bundleSelection');


            if (
                bundleSelection === 'true'
            ) {

                this.enterBundleSelectionMode(
                    params
                );

                return;
            }


            /*
             * ====================================================
             * MODE NORMAL
             *
             * Ici les cases restent visibles.
             *
             * La sélection sert à créer un nouveau pack
             * ou une nouvelle cure.
             * ====================================================
             */

            this.isBundleSelectionMode =
                false;

            this.returnTarget =
                'bundle';

            this.bundleReturnMode =
                null;

            this.bundleReturnId =
                null;

            this.initialBundleProductIds =
                [];


            /*
             * IMPORTANT :
             *
             * On ne vide PAS selectedProductIds ici.
             *
             * Cela permet à la sélection de rester disponible
             * pendant les recherches et les changements de page.
             */

            this.loadProducts();

        });

    }


    // ============================================================
    // ENTREE EN MODE SELECTION (PACK OU CURE)
    // ============================================================

    private enterBundleSelectionMode(
        params: any
    ): void {

        this.isBundleSelectionMode =
            true;


        /*
         * Formulaire d'origine : pack (défaut) ou cure.
         */

        this.returnTarget =
            params.get('target') === 'cure'
                ? 'cure'
                : 'bundle';


        /*
         * Création ou modification.
         */

        const returnMode =
            params.get('returnMode');


        this.bundleReturnMode =
            returnMode === 'edit'
                ? 'edit'
                : 'new';


        /*
         * ID du pack / de la cure en modification.
         */

        const bundleIdParam =
            params.get('bundleId');


        this.bundleReturnId =
            bundleIdParam
                ? Number(bundleIdParam)
                : null;


        /*
         * Produits déjà présents dans le pack / la cure.
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
         * IMPORTANT :
         *
         * On mémorise cette sélection pour le bouton Annuler.
         */

        this.initialBundleProductIds =
            [...productIds];


        /*
         * Sélection courante.
         */

        this.selectedProductIds =
            new Set(productIds);


        /*
         * On recharge depuis la première page.
         */

        this.currentPage = 0;

        this.loadProducts();

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
    // NAVIGATION VERS LE FORMULAIRE D'ORIGINE (PACK OU CURE)
    // ============================================================

    private navigateToForm(
        productIds: number[]
    ): void {

        const base =
            this.returnTarget === 'cure'
                ? '/admin/cures'
                : '/admin/bundles';


        const commands =
            this.bundleReturnMode === 'edit' &&
            this.bundleReturnId !== null
                ? [base, 'edit', this.bundleReturnId]
                : [base, 'new'];


        this.router.navigate(
            commands,
            {
                queryParams: {

                    productIds:
                        productIds.join(',')

                }
            }
        );

    }


    // ============================================================
    // CREATION DU PACK
    // ============================================================

    continueToBundleCreation(): void {

        const productIds =
            Array.from(
                this.selectedProductIds
            );


        /*
         * Le bouton n'est disponible que s'il existe
         * au moins un produit.
         */

        if (
            productIds.length === 0
        ) {

            return;

        }


        /*
         * Mode sélection depuis un pack OU une cure :
         * on revient au bon formulaire (création ou édition).
         */

        if (
            this.isBundleSelectionMode
        ) {

            this.navigateToForm(
                productIds
            );

            return;

        }


        /*
         * ========================================================
         * MODE NORMAL
         *
         * Création d'un nouveau pack depuis la liste normale.
         * ========================================================
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


    // ============================================================
    // CREATION DE LA CURE (MODE NORMAL)
    // ============================================================

    createCure(): void {

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
            [
                '/admin/cures/new'
            ],
            {
                queryParams: {

                    productIds:
                        productIds.join(',')

                }
            }
        );

    }


    // ============================================================
    // CONFIRMATION SELECTION
    // ============================================================

    confirmBundleSelection(): void {

        this.continueToBundleCreation();

    }


    // ============================================================
    // ANNULATION SELECTION
    // ============================================================

    cancelBundleSelection(): void {

        /*
         * CURE :
         * on renvoie toujours la sélection initiale pour que
         * le formulaire retrouve son brouillon (création et édition).
         */

        if (
            this.returnTarget === 'cure'
        ) {

            this.navigateToForm(
                this.initialBundleProductIds
            );

            return;

        }


        /*
         * PACK - EDITION
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
         * PACK - CREATION
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
    // RETOUR AU FORMULAIRE
    // ============================================================

    navigateBackToBundle(): void {

        this.confirmBundleSelection();

    }


    // ============================================================
    // SUPPRESSION D'UN PRODUIT
    // ============================================================

    deleteProduct(productId: number): void {

        if (this.isBundleSelectionMode) {
            return;
        }

        const product = this.products.find(
            p => p.id === productId
        );

        const confirmed = window.confirm(
            `Voulez-vous vraiment supprimer le produit "${product?.name ?? productId}" ? Cette action est irréversible.`
        );

        if (!confirmed) {
            return;
        }

        this.errorMessage = '';

        this.productService.deleteProduct(productId).subscribe({
            next: () => {
                // Retirer le produit de la sélection locale.
                this.selectedProductIds.delete(productId);

                // Si le dernier produit de la page vient d'être supprimé,
                // revenir à la page précédente lorsqu'elle existe.
                if (this.products.length === 1 && this.currentPage > 0) {
                    this.currentPage--;
                }

                // Recharger la liste depuis le backend.
                this.loadProducts();
            },
            error: (err) => {
                console.error('Erreur lors de la suppression :', err);

                this.errorMessage =
                    err?.error?.message ??
                    'Impossible de supprimer ce produit.';

                window.alert(this.errorMessage);
            }
        });

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