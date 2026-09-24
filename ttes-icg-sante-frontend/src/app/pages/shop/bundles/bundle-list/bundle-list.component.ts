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

    addingBundleId: number | null = null;

    // ============================================================
    // GENERAL
    // ============================================================

    currentYear = new Date().getFullYear();

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
     * Valeur possible :
     * - ''       = tous
     * - 'stock'  = disponibles
     * - 'out'    = rupture
     */
    stockFilter = '';


    // ============================================================
    // PAGINATION
    // ============================================================

    currentPage = 0;

    pageSize = 8;

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

                    this.updatePagination();

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
    // SEARCH
    // ============================================================

    search(): void {

        const term =
            this.searchTerm
                .trim()
                .toLowerCase();


        this.filteredBundles =
            this.bundles.filter(
                bundle => {

                    // ------------------------------------------------
                    // Recherche textuelle
                    // ------------------------------------------------

                    const matchesSearch =
                        !term ||

                        bundle.name
                            ?.toLowerCase()
                            .includes(term) ||

                        bundle.description
                            ?.toLowerCase()
                            .includes(term);


                    // ------------------------------------------------
                    // Filtre stock
                    // ------------------------------------------------

                    const matchesStock =
                        !this.stockFilter ||

                        (
                            this.stockFilter === 'stock' &&
                            this.isBundleAvailable(bundle)
                        ) ||

                        (
                            this.stockFilter === 'out' &&
                            !this.isBundleAvailable(bundle)
                        );


                    return (
                        matchesSearch &&
                        matchesStock
                    );
                }
            );


        // Recalcul de la pagination
        this.currentPage = 0;

        this.updatePagination();
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
    // PAGINATION
    // ============================================================

    updatePagination(): void {

        this.totalPages =
            Math.ceil(
                this.filteredBundles.length /
                this.pageSize
            );


        if (this.totalPages === 0) {

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


    previousPage(): void {

        if (this.currentPage > 0) {

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

        return !this.isBundleAvailable(bundle);
    }


    // ============================================================
    // BUNDLE ITEM COUNT
    // ============================================================

    getBundleItemCount(
        bundle: BundleResponse
    ): number {

        return bundle.items?.length ?? 0;
    }

    addToCart(bundle: BundleResponse): void {

        if (bundle.stock <= 0) {
            alert(
                'Ce pack est actuellement en rupture de stock.'
            );
            return;
        }

        if (!this.authService.isLoggedIn()) {

            this.router.navigate(
                ['/signin'],
                {
                    queryParams: {
                        returnUrl: this.router.url
                    }
                }
            );

            return;
        }

        if (this.addingBundleId === bundle.id) {
            return;
        }

        this.addingBundleId = bundle.id;

        this.cartService
            .addBundle(bundle.id, 1)
            .subscribe({

                next: () => {

                    this.addingBundleId = null;

                    alert(
                        'Pack ajouté au panier.'
                    );
                },

                error: (error) => {

                    console.error(
                        'Erreur ajout pack au panier :',
                        error
                    );

                    this.addingBundleId = null;

                    if (error.status === 401) {

                        this.authService.logout();

                        this.router.navigate(
                            ['/signin'],
                            {
                                queryParams: {
                                    returnUrl: this.router.url
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
            ).format(price ?? 0) +
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
                    'input[type="search"]'
                ) as HTMLInputElement | null;


            if (input) {

                input.focus();
            }

        });
    }
}

