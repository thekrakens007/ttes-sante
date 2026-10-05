import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { Router } from '@angular/router';

import { CartService } from '../../../../core/services/cart.service';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { RouterModule } from '@angular/router';

import { BundleService } from '../../../../core/services/bundle.service';

import { BundleResponse } from '../../../../core/interfaces/bundle-response.interface';

import { AuthService } from '../../../../core/services/auth.service';


@Component({
    selector: 'app-bundle-list',

    standalone: true,

    imports: [
        CommonModule,
        FormsModule,
        RouterModule
    ],

    templateUrl: './bundle-list.component.html'
})
export class BundleListComponent implements OnInit {

    // ============================================================
    // SERVICES
    // ============================================================

    private bundleService = inject(BundleService);

    private authService = inject(AuthService);

    private router = inject(Router);

    private cartService = inject(CartService);


    // ============================================================
    // CART
    // ============================================================

    addingBundleId: number | null = null;


    // ============================================================
    // GENERAL
    // ============================================================

    currentYear =
        new Date().getFullYear();

    mobileMenuOpen = false;


    // ============================================================
    // BUNDLES
    // ============================================================

    bundles: BundleResponse[] = [];

    filteredBundles: BundleResponse[] = [];


    // ============================================================
    // LOADING / ERROR
    // ============================================================

    loading = true;

    error = '';


    // ============================================================
    // SEARCH
    // ============================================================

    searchTerm = '';


    // ============================================================
    // FILTERS
    // ============================================================

    /**
     * Valeurs possibles :
     *
     * ''            = tous
     * 'available'   = disponibles
     * 'unavailable' = rupture
     */
    stockFilter = '';


    // ============================================================
    // PAGINATION
    // ============================================================

    currentPage = 0;

    /**
     * Nombre de packs affichés par page.
     */
    pageSize = 12;

    totalPages = 0;

    pages: number[] = [];


    // ============================================================
    // INIT
    // ============================================================

    ngOnInit(): void {

        this.loadBundles();

    }


    // ============================================================
    // MOBILE MENU
    // ============================================================

    toggleMobileMenu(): void {

        this.mobileMenuOpen =
            !this.mobileMenuOpen;

    }


    closeMobileMenu(): void {

        this.mobileMenuOpen = false;

    }


    // ============================================================
    // AUTHENTICATION
    // ============================================================

    isLoggedIn(): boolean {

        return this.authService.isLoggedIn();

    }


    isAdmin(): boolean {

        if (!this.isLoggedIn()) {

            return false;

        }

        return this.authService.hasRole(
            'ROLE_ADMIN'
        );

    }


    // ============================================================
    // LOAD BUNDLES
    // ============================================================

    loadBundles(): void {

        this.loading = true;

        this.error = '';


        this.bundleService
            .getBundles()
            .subscribe({

                next: (bundles) => {

                    this.bundles =
                        bundles ?? [];

                    this.currentPage = 0;

                    this.search();

                    this.loading = false;

                },


                error: (error) => {

                    console.error(
                        'Erreur chargement packs :',
                        error
                    );


                    this.bundles = [];

                    this.filteredBundles = [];

                    this.pages = [];

                    this.totalPages = 0;


                    this.error =
                        error?.error?.message ??
                        'Impossible de charger les packs.';


                    this.loading = false;

                }

            });

    }


    // ============================================================
    // NORMALISATION DU TEXTE
    // ============================================================

    /**
     * Normalise une valeur pour la recherche.
     *
     * Exemple :
     *
     * "Médicament" -> "medicament"
     * "MÉDICAMENT" -> "medicament"
     * "Douleur"    -> "douleur"
     */
    private normalizeSearchText(
        value: unknown
    ): string {

        if (
            value === null ||
            value === undefined
        ) {

            return '';

        }


        return String(value)
            .normalize('NFD')
            .replace(
                /[\u0300-\u036f]/g,
                ''
            )
            .toLowerCase()
            .trim();

    }


    // ============================================================
    // SEARCH
    // ============================================================

    search(): void {

        const term =
            this.normalizeSearchText(
                this.searchTerm
            );


        this.filteredBundles =
            this.bundles.filter(
                bundle => {

                    // ------------------------------------------------
                    // RECHERCHE
                    // ------------------------------------------------

                    const matchesSearch =
                        !term ||
                        this.bundleMatchesSearch(
                            bundle,
                            term
                        );


                    // ------------------------------------------------
                    // FILTRE STOCK
                    // ------------------------------------------------

                    const matchesStock =
                        !this.stockFilter ||

                        (
                            this.stockFilter === 'available' &&
                            this.isBundleAvailable(
                                bundle
                            )
                        ) ||

                        (
                            this.stockFilter === 'unavailable' &&
                            !this.isBundleAvailable(
                                bundle
                            )
                        );


                    return (
                        matchesSearch &&
                        matchesStock
                    );

                }
            );


        // ------------------------------------------------
        // PAGINATION
        // ------------------------------------------------

        this.currentPage = 0;

        this.updatePagination();

    }


    // ============================================================
    // SEARCH DANS LE PACK
    // ============================================================

    private bundleMatchesSearch(
        bundle: BundleResponse,
        term: string
    ): boolean {

        // ========================================================
        // INFORMATIONS DU PACK
        // ========================================================

        const bundleValues: unknown[] = [

            bundle.id,

            bundle.name,

            bundle.description,

            bundle.price,

            bundle.stock,

            bundle.active

        ];


        const bundleText =
            bundleValues
                .map(value =>
                    this.normalizeSearchText(
                        value
                    )
                )
                .join(' ');


        if (
            bundleText.includes(term)
        ) {

            return true;

        }


        // ========================================================
        // PRODUITS DU PACK
        // ========================================================

        if (
            !bundle.items ||
            bundle.items.length === 0
        ) {

            return false;

        }


        return bundle.items.some(
            item => {

                const productValues: unknown[] = [

                    // ------------------------------------------------
                    // IDENTIFICATION
                    // ------------------------------------------------

                    item.id,

                    item.productId,

                    item.productName,

                    item.sku,


                    // ------------------------------------------------
                    // CARACTERISTIQUES
                    // ------------------------------------------------

                    item.description,

                    item.brand,

                    item.activeIngredient,

                    item.dosage,

                    item.form,

                    item.ingredients,


                    // ------------------------------------------------
                    // ENTREPRISE
                    // ------------------------------------------------

                    item.companyId,

                    item.companyName,


                    // ------------------------------------------------
                    // CATEGORIES
                    // ------------------------------------------------

                    ...(item.categoryIds ?? []),

                    ...(item.categories ?? []),


                    // ------------------------------------------------
                    // DOMAINES THERAPEUTIQUES
                    // ------------------------------------------------

                    ...(item.therapeuticAreaIds ?? []),

                    ...(item.therapeuticAreas ?? []),


                    // ------------------------------------------------
                    // PRIX / STOCK / QUANTITE
                    // ------------------------------------------------

                    item.unitPrice,

                    item.quantity,

                    item.availableStock

                ];


                const productText =
                    productValues
                        .map(value =>
                            this.normalizeSearchText(
                                value
                            )
                        )
                        .join(' ');


                return productText.includes(
                    term
                );

            }
        );

    }


    // ============================================================
    // RESET FILTERS
    // ============================================================

    resetFilters(): void {

        this.searchTerm = '';

        this.stockFilter = '';

        this.filteredBundles = [
            ...this.bundles
        ];

        this.currentPage = 0;

        this.updatePagination();

    }


    // ============================================================
    // CLEAR SEARCH
    // ============================================================

    clearSearch(): void {

        this.searchTerm = '';

        this.search();

    }


    // ============================================================
    // PAGINATION
    // ============================================================

    updatePagination(): void {

        this.totalPages =
            Math.ceil(
                this.filteredBundles.length /
                this.pageSize
            );


        if (
            this.totalPages === 0
        ) {

            this.pages = [];

            return;

        }


        this.pages = Array.from(
            {
                length: this.totalPages
            },
            (_, index) => index
        );


        if (
            this.currentPage >=
            this.totalPages
        ) {

            this.currentPage =
                this.totalPages - 1;

        }

    }


    // ============================================================
    // PACKS DE LA PAGE COURANTE
    // ============================================================

    get paginatedBundles(): BundleResponse[] {

        const start =
            this.currentPage *
            this.pageSize;


        const end =
            start +
            this.pageSize;


        return this.filteredBundles.slice(
            start,
            end
        );

    }


    // ============================================================
    // ALLER À UNE PAGE
    // ============================================================

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


        window.scrollTo({

            top: 0,

            behavior: 'smooth'

        });

    }


    // ============================================================
    // PAGE SUIVANTE
    // ============================================================

    nextPage(): void {

        if (
            this.currentPage <
            this.totalPages - 1
        ) {

            this.currentPage++;


            window.scrollTo({

                top: 0,

                behavior: 'smooth'

            });

        }

    }


    // ============================================================
    // PAGE PRECEDENTE
    // ============================================================

    previousPage(): void {

        if (
            this.currentPage > 0
        ) {

            this.currentPage--;


            window.scrollTo({

                top: 0,

                behavior: 'smooth'

            });

        }

    }


    // ============================================================
    // BUNDLE IMAGE
    // ============================================================

    getMainImage(
        bundle: BundleResponse
    ): string | null {

        if (
            !bundle.images ||
            bundle.images.length === 0
        ) {

            return '/images/products/default-product.png';

        }


        const mainImage =
            bundle.images.find(
                image => image.main
            );


        return (
            mainImage?.imageUrl ??
            bundle.images[0]?.imageUrl ??
            '/images/products/default-product.png'
        );

    }


    // ============================================================
    // BUNDLE AVAILABILITY
    // ============================================================

    isBundleAvailable(
        bundle: BundleResponse
    ): boolean {

        return (
            bundle.stock !== undefined &&
            bundle.stock > 0
        );

    }


    isOutOfStock(
        bundle: BundleResponse
    ): boolean {

        return !this.isBundleAvailable(
            bundle
        );

    }


    // ============================================================
    // BUNDLE ITEM COUNT
    // ============================================================

    getBundleItemCount(
        bundle: BundleResponse
    ): number {

        return bundle.items?.length ?? 0;

    }


    // ============================================================
    // ADD TO CART
    // ============================================================

    addToCart(
        bundle: BundleResponse
    ): void {

        // --------------------------------------------------------
        // STOCK
        // --------------------------------------------------------

        if (
            bundle.stock <= 0
        ) {

            alert(
                'Ce pack est actuellement en rupture de stock.'
            );

            return;

        }


        // --------------------------------------------------------
        // AUTHENTIFICATION
        // --------------------------------------------------------

        if (
            !this.authService.isLoggedIn()
        ) {

            this.router.navigate(
                ['/signin'],
                {
                    queryParams: {
                        returnUrl:
                            this.router.url
                    }
                }
            );

            return;

        }


        // --------------------------------------------------------
        // EVITER DOUBLE CLIC
        // --------------------------------------------------------

        if (
            this.addingBundleId ===
            bundle.id
        ) {

            return;

        }


        this.addingBundleId =
            bundle.id;


        // --------------------------------------------------------
        // AJOUT AU PANIER
        // --------------------------------------------------------

        this.cartService
            .addBundle(
                bundle.id,
                1
            )
            .subscribe({

                next: () => {

                    this.addingBundleId =
                        null;


                    alert(
                        'Pack ajouté au panier.'
                    );

                },


                error: (error) => {

                    console.error(
                        'Erreur ajout pack au panier :',
                        error
                    );


                    this.addingBundleId =
                        null;


                    // ------------------------------------------------
                    // SESSION EXPIREE
                    // ------------------------------------------------

                    if (
                        error.status === 401
                    ) {

                        this.authService.logout();


                        this.router.navigate(
                            ['/signin'],
                            {
                                queryParams: {
                                    returnUrl:
                                        this.router.url
                                }
                            }
                        );


                        return;

                    }


                    alert(
                        error?.error?.message ??
                        'Impossible d’ajouter le pack au panier.'
                    );

                }

            });

    }


    // ============================================================
    // PRICE
    // ============================================================

    formatPrice(
        price: number | undefined
    ): string {

        return (
            new Intl.NumberFormat(
                'fr-FR'
            ).format(
                price ?? 0
            ) +
            ' FCFA'
        );

    }


    // ============================================================
    // FOCUS SEARCH
    // ============================================================

    focusSearch(): void {

        setTimeout(() => {

            const input =
                document.querySelector(
                    'input[type="text"]'
                ) as HTMLInputElement | null;


            if (input) {

                input.focus();

            }

        });

    }

}
