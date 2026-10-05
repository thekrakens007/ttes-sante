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

import { AdminService } from '../../../../core/services/admin.service';
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

    private adminService =
        inject(AdminService);

    private router =
        inject(Router);

    private route =
        inject(ActivatedRoute);


    products: Product[] = [];

    loading = true;

    errorMessage = '';

    searchTerm = '';


    currentPage = 0;

    pageSize = 8;

    totalPages = 0;

    totalElements = 0;

    pages: number[] = [];


    /**
     * Sélection globale.
     *
     * Le Set n'est jamais réinitialisé lorsqu'on
     * change de page ou de recherche.
     */
    selectedProductIds =
        new Set<number>();


    /**
     * Mode sélection pour création/modification
     * d'un pack.
     */
    isBundleSelectionMode = false;


    /**
     * IDs présents lorsque l'utilisateur est
     * arrivé sur cette page.
     *
     * Permet à "Annuler" de restaurer la sélection.
     */
    initialBundleProductIds: number[] = [];


    bundleReturnMode:
        | 'new'
        | 'edit'
        = 'new';


    bundleReturnId:
        number | null = null;


    ngOnInit(): void {

        this.route.queryParams
            .subscribe(params => {

                this.readBundleSelectionParams(
                    params
                );

                this.loadProducts();
            });
    }


    /**
     * Lit les paramètres du mode sélection.
     */
    private readBundleSelectionParams(
        params: any
    ): void {

        const selectionMode =
            params['bundleSelection'];


        this.isBundleSelectionMode =
            selectionMode === true ||
            selectionMode === 'true';


        if (!this.isBundleSelectionMode) {

            this.initialBundleProductIds = [];

            this.bundleReturnMode = 'new';

            this.bundleReturnId = null;

            return;
        }


        const ids =
            this.parseProductIds(
                params['productIds']
            );


        /*
         * Lors de l'arrivée dans la page,
         * ces IDs représentent l'état initial.
         */
        this.selectedProductIds =
            new Set(ids);

        this.initialBundleProductIds =
            [...ids];


        const returnMode =
            params['returnMode'];


        this.bundleReturnMode =
            returnMode === 'edit'
                ? 'edit'
                : 'new';


        const bundleId =
            Number(
                params['bundleId']
            );


        this.bundleReturnId =
            Number.isInteger(bundleId) &&
            bundleId > 0
                ? bundleId
                : null;
    }


    /**
     * Parse les productIds.
     */
    private parseProductIds(
        value: any
    ): number[] {

        if (
            value === null ||
            value === undefined
        ) {
            return [];
        }


        const values =
            Array.isArray(value)
                ? value
                : [value];


        const ids: number[] = [];


        for (const valueItem of values) {

            const parts =
                String(valueItem)
                    .split(',');


            for (const part of parts) {

                const id =
                    Number(part);


                if (
                    Number.isInteger(id) &&
                    id > 0 &&
                    !ids.includes(id)
                ) {
                    ids.push(id);
                }
            }
        }


        return ids;
    }


    /**
     * Nombre de produits sélectionnés.
     */
    get selectedProductCount(): number {

        return this.selectedProductIds.size;
    }


    /**
     * Charge les produits.
     */
    loadProducts(): void {

        this.loading = true;

        this.errorMessage = '';


        const keyword =
            this.searchTerm.trim();


        const request =
            keyword

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


    /**
     * Génère les pages.
     */
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


    /**
     * Recherche.
     */
    submitSearch(): void {

        this.currentPage = 0;

        this.loadProducts();
    }


    /**
     * Change de page.
     */
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


    /**
     * Page précédente.
     */
    previousPage(): void {

        if (
            this.currentPage > 0
        ) {

            this.currentPage--;

            this.loadProducts();
        }
    }


    /**
     * Page suivante.
     */
    nextPage(): void {

        if (
            this.currentPage <
            this.totalPages - 1
        ) {

            this.currentPage++;

            this.loadProducts();
        }
    }


    /**
     * Sélectionne/désélectionne un produit.
     *
     * Le Set persiste entre les pages.
     */
    toggleProductSelection(
        productId: number
    ): void {

        if (
            this.selectedProductIds
                .has(productId)
        ) {

            this.selectedProductIds
                .delete(productId);

        } else {

            this.selectedProductIds
                .add(productId);
        }
    }


    /**
     * Vérifie si le produit est sélectionné.
     */
    isProductSelected(
        productId: number
    ): boolean {

        return this.selectedProductIds
            .has(productId);
    }


    /**
     * Sélectionne tous les produits visibles.
     */
    selectAllVisible(): void {

        for (
            const product of this.products
        ) {

            this.selectedProductIds
                .add(product.id);
        }
    }


    /**
     * Désélectionne tous les produits visibles.
     */
    deselectAllVisible(): void {

        for (
            const product of this.products
        ) {

            this.selectedProductIds
                .delete(product.id);
        }
    }


    /**
     * Vérifie si tous les produits visibles
     * sont sélectionnés.
     */
    areAllVisibleSelected(): boolean {

        if (
            this.products.length === 0
        ) {
            return false;
        }


        return this.products.every(
            product =>
                this.selectedProductIds
                    .has(product.id)
        );
    }


    /**
     * Vide toute la sélection.
     */
    clearProductSelection(): void {

        this.selectedProductIds.clear();
    }


    /**
     * Crée un nouveau pack avec les produits
     * actuellement sélectionnés.
     */
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
                    productIds:
                        productIds.join(',')
                }
            }
        );
    }


    /**
     * Annule la sélection en cours.
     *
     * Les changements effectués pendant cette
     * session sont abandonnés.
     */
    cancelBundleSelection(): void {

        this.selectedProductIds =
            new Set(
                this.initialBundleProductIds
            );


        this.navigateBackToBundle(
            this.initialBundleProductIds
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


        this.navigateBackToBundle(
            productIds
        );
    }


    /**
     * Retourne au formulaire du pack.
     */
    private navigateBackToBundle(
        productIds: number[]
    ): void {

        const ids =
            [...new Set(productIds)];


        /*
         * IMPORTANT :
         * On conserve les paramètres permettant
         * au formulaire de savoir s'il s'agit
         * d'une création ou d'une modification.
         */
        if (
            this.bundleReturnMode === 'edit' &&
            this.bundleReturnId !== null
        ) {

            this.router.navigate(
                ['/admin/bundles/edit',
                    this.bundleReturnId
                ],
                {
                    queryParams: {
                        productIds:
                            ids.join(',')
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
                        ids.join(',')
                }
            }
        );
    }


    /**
     * Image principale.
     */
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


    /**
     * Couleur de stock.
     *
     * Conservée pour compatibilité éventuelle
     * avec d'autres templates.
     */
    getStockColor(
        stock: number
    ):
        | 'success'
        | 'warning'
        | 'error'
    {

        if (stock <= 0) {
            return 'error';
        }


        if (stock < 10) {
            return 'warning';
        }


        return 'success';
    }


    /**
     * Label du stock.
     */
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


    /**
     * Suppression d'un produit.
     */
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
