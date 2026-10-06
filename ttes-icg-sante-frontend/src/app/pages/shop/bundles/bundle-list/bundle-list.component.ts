import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';

import {
    FormsModule
} from '@angular/forms';

import {
    Router,
    RouterModule
} from '@angular/router';

import {
    BundleService
} from '../../../../core/services/bundle.service';

import {
    BundleResponse
} from '../../../../core/interfaces/bundle-response.interface';

import {
    AuthService
} from '../../../../core/services/auth.service';

import {
    CartService
} from '../../../../core/services/cart.service';

import {
    Cart
} from '../../../../core/interfaces/cart.interface';


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

    private bundleService =
        inject(BundleService);

    private authService =
        inject(AuthService);

    private router =
        inject(Router);

    private cartService =
        inject(CartService);


    // ============================================================
    // CART
    // ============================================================

    /**
     * Panier courant de l'utilisateur.
     */
    cart: Cart | null = null;

    /**
     * Nombre total d'articles dans le panier.
     */
    cartCount = 0;

    /**
     * ID du pack actuellement en cours d'ajout.
     */
    addingBundleId: number | null = null;

    /**
     * Message de succès.
     */
    cartMessage = '';

    /**
     * Message d'erreur.
     */
    cartError = '';


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

        /*
         * Charger le panier uniquement si
         * l'utilisateur est connecté.
         */
        this.loadCart();
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
    // LOAD CART
    // ============================================================

    loadCart(): void {

        /*
         * Pas de panier à charger si
         * l'utilisateur n'est pas connecté.
         */
        if (
            !this.authService.isLoggedIn()
        ) {

            this.cart = null;

            this.cartCount = 0;

            return;
        }


        this.cartService
            .getCart()
            .subscribe({

                next: (
                    cart: Cart
                ) => {

                    this.cart = cart;

                    this.updateCartCount();
                },


                error: (
                    error: unknown
                ) => {

                    console.error(
                        'Erreur chargement panier :',
                        error
                    );

                    this.cart = null;

                    this.cartCount = 0;
                }

            });
    }


    // ============================================================
    // CART COUNT
    // ============================================================

    updateCartCount(): void {

        if (
            !this.cart?.items
        ) {

            this.cartCount = 0;

            return;
        }


        this.cartCount =
            this.cart.items.reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    (
                        item.quantity ?? 0
                    ),
                0
            );
    }


    // ============================================================
    // QUANTITE D'UN PACK DANS LE PANIER
    // ============================================================

    getBundleCartQuantity(
        bundleId: number
    ): number {

        if (
            !this.cart?.items
        ) {

            return 0;
        }


        const item =
            this.cart.items.find(
                (cartItem: any) => {

                    return (
                        cartItem.bundleId ===
                            bundleId

                        ||

                        cartItem.bundle?.id ===
                            bundleId
                    );
                }
            );


        return item?.quantity ?? 0;
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

                next: (
                    bundles
                ) => {

                    this.bundles =
                        bundles ?? [];

                    this.currentPage = 0;

                    this.search();

                    this.loading = false;
                },


                error: (
                    error
                ) => {

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

                    const matchesSearch =
                        !term ||
                        this.bundleMatchesSearch(
                            bundle,
                            term
                        );


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
                .map(
                    value =>
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


        if (
            !bundle.items ||
            bundle.items.length === 0
        ) {

            return false;
        }


        return bundle.items.some(
            item => {

                const productValues: unknown[] = [

                    item.id,

                    item.productId,

                    item.productName,

                    item.sku,

                    item.description,

                    item.brand,

                    item.activeIngredient,

                    item.dosage,

                    item.form,

                    item.ingredients,

                    item.companyId,

                    item.companyName,

                    ...(item.categoryIds ?? []),

                    ...(item.categories ?? []),

                    ...(item.therapeuticAreaIds ?? []),

                    ...(item.therapeuticAreas ?? []),

                    item.unitPrice,

                    item.quantity,

                    item.availableStock

                ];


                const productText =
                    productValues
                        .map(
                            value =>
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


        this.pages =
            Array.from(
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

        /*
         * ========================================================
         * NON CONNECTÉ
         * ========================================================
         *
         * Comme pour les produits :
         * on redirige directement vers la connexion.
         */
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


        /*
         * ========================================================
         * STOCK
         * ========================================================
         */

        if (
            bundle.stock <= 0
        ) {

            this.cartError =
                'Ce pack est actuellement en rupture de stock.';

            this.cartMessage = '';


            setTimeout(() => {

                this.cartError = '';

            }, 4000);


            return;
        }


        /*
         * ========================================================
         * EVITER DOUBLE CLIC
         * ========================================================
         */

        if (
            this.addingBundleId !== null
        ) {

            return;
        }


        this.addingBundleId =
            bundle.id;

        this.cartMessage = '';

        this.cartError = '';


        /*
         * ========================================================
         * AJOUT DU PACK
         * ========================================================
         *
         * Le backend retourne le panier mis à jour.
         */
        this.cartService
            .addBundle(
                bundle.id,
                1
            )
            .subscribe({

                next: (
                    cart: Cart
                ) => {

                    /*
                     * Remplacer le panier local
                     * par celui retourné par le backend.
                     */
                    this.cart = cart;


                    /*
                     * Recalculer le compteur global.
                     */
                    this.updateCartCount();


                    this.cartMessage =
                        `${bundle.name} a été ajouté au panier.`;


                    this.addingBundleId =
                        null;


                    setTimeout(() => {

                        this.cartMessage = '';

                    }, 3000);
                },


                error: (
                    error: any
                ) => {

                    console.error(
                        'Erreur ajout pack au panier :',
                        error
                    );


                    this.addingBundleId =
                        null;


                    /*
                     * Session expirée.
                     */
                    if (
                        error?.status === 401
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


                    this.cartError =
                        error?.error?.message ??
                        'Impossible d’ajouter le pack au panier.';


                    this.cartMessage = '';


                    setTimeout(() => {

                        this.cartError = '';

                    }, 4000);
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
