
import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
    Router,
    RouterModule
} from '@angular/router';

import { BundleService } from '../../../../core/services/bundle.service';

import {
    BundleResponse
} from '../../../../core/interfaces/bundle-response.interface';

import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';

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

    private bundleService = inject(BundleService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private cartService = inject(CartService);

    // ============================================================
    // CART
    // ============================================================

    cart: Cart | null = null;
    cartCount = 0;
    addingBundleId: number | null = null;

    cartMessage = '';
    cartError = '';

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
     * ''            = tous
     * 'available'   = disponibles
     * 'unavailable' = rupture
     */
    stockFilter: '' | 'available' | 'unavailable' = '';

    // ============================================================
    // BACKEND PAGINATION
    // ============================================================

    /**
     * La pagination Spring Boot commence à 0.
     */
    currentPage = 0;

    pageSize = 12;

    totalPages = 0;
    totalElements = 0;

    pages: number[] = [];

    // ============================================================
    // INIT
    // ============================================================

    ngOnInit(): void {
        this.loadBundles();
        this.loadCart();
    }

    // ============================================================
    // MOBILE MENU
    // ============================================================

    toggleMobileMenu(): void {
        this.mobileMenuOpen = !this.mobileMenuOpen;
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

        return this.authService.hasRole('ROLE_ADMIN');
    }

    // ============================================================
    // LOAD CART
    // ============================================================

    loadCart(): void {

        if (!this.authService.isLoggedIn()) {
            this.cart = null;
            this.cartCount = 0;
            return;
        }

        this.cartService.getCart().subscribe({

            next: (cart: Cart) => {
                this.cart = cart;
                this.updateCartCount();
            },

            error: (error: unknown) => {
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

        if (!this.cart?.items) {
            this.cartCount = 0;
            return;
        }

        this.cartCount = this.cart.items.reduce(
            (total, item) => total + (item.quantity ?? 0),
            0
        );
    }

    // ============================================================
    // QUANTITE D'UN PACK DANS LE PANIER
    // ============================================================

    getBundleCartQuantity(bundleId: number): number {

        if (!this.cart?.items) {
            return 0;
        }

        const item = this.cart.items.find(
            (cartItem: any) => {
                return (
                    cartItem.bundleId === bundleId ||
                    cartItem.bundle?.id === bundleId
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
            .getBundles(this.currentPage, this.pageSize)
            .subscribe({

                next: (response) => {

                    this.bundles = response.content ?? [];

                    this.totalPages = response.totalPages ?? 0;
                    this.totalElements = response.totalElements ?? 0;

                    // Générer les numéros de pages.
                    this.updatePagination();

                    // Appliquer les filtres sur la page reçue.
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
                    this.totalElements = 0;

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

    private normalizeSearchText(value: unknown): string {

        if (value === null || value === undefined) {
            return '';
        }

        return String(value)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    // ============================================================
    // SEARCH
    // ============================================================

    search(): void {

        const term = this.normalizeSearchText(
            this.searchTerm
        );

        this.filteredBundles = this.bundles.filter(
            bundle => {

                const matchesSearch =
                    !term ||
                    this.bundleMatchesSearch(bundle, term);

                const matchesStock =
                    !this.stockFilter ||

                    (
                        this.stockFilter === 'available' &&
                        this.isBundleAvailable(bundle)
                    ) ||

                    (
                        this.stockFilter === 'unavailable' &&
                        !this.isBundleAvailable(bundle)
                    );

                return matchesSearch && matchesStock;
            }
        );
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

        const bundleText = bundleValues
            .map(value => this.normalizeSearchText(value))
            .join(' ');

        if (bundleText.includes(term)) {
            return true;
        }

        if (!bundle.items || bundle.items.length === 0) {
            return false;
        }

        return bundle.items.some(item => {

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

            const productText = productValues
                .map(value => this.normalizeSearchText(value))
                .join(' ');

            return productText.includes(term);
        });
    }

    // ============================================================
    // RESET FILTERS
    // ============================================================

    resetFilters(): void {

        this.searchTerm = '';
        this.stockFilter = '';

        this.search();
    }

    // ============================================================
    // CLEAR SEARCH
    // ============================================================

    clearSearch(): void {

        this.searchTerm = '';
        this.search();
    }

    // ============================================================
    // BACKEND PAGINATION
    // ============================================================

    updatePagination(): void {

        this.pages = Array.from(
            { length: this.totalPages },
            (_, index) => index
        );
    }

    // ============================================================
    // PACKS DE LA PAGE COURANTE
    // ============================================================

    /**
     * Le backend effectue déjà le découpage.
     * Aucun slice() supplémentaire n'est nécessaire.
     */
    get paginatedBundles(): BundleResponse[] {
        return this.filteredBundles;
    }

    // ============================================================
    // ALLER À UNE PAGE
    // ============================================================

    goToPage(page: number): void {

        if (
            page < 0 ||
            page >= this.totalPages ||
            page === this.currentPage
        ) {
            return;
        }

        this.currentPage = page;
        this.loadBundles();

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // ============================================================
    // PAGE SUIVANTE
    // ============================================================

    nextPage(): void {

        if (this.currentPage < this.totalPages - 1) {

            this.currentPage++;
            this.loadBundles();

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

        if (this.currentPage > 0) {

            this.currentPage--;
            this.loadBundles();

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }

    // ============================================================
    // CHANGEMENT DU NOMBRE DE PACKS PAR PAGE
    // ============================================================

    onPageSizeChange(): void {

        this.currentPage = 0;
        this.loadBundles();
    }

    // ============================================================
    // BUNDLE IMAGE
    // ============================================================

    getMainImage(
        bundle: BundleResponse
    ): string | null {

        if (!bundle.images || bundle.images.length === 0) {
            return '/images/products/default-product.png';
        }

        const mainImage = bundle.images.find(
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

    // ============================================================
    // ADD TO CART
    // ============================================================

    addToCart(bundle: BundleResponse): void {

        // NON CONNECTÉ
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

        // STOCK
        if (bundle.stock <= 0) {

            this.cartError =
                'Ce pack est actuellement en rupture de stock.';

            this.cartMessage = '';

            setTimeout(() => {
                this.cartError = '';
            }, 4000);

            return;
        }

        // ÉVITER DOUBLE CLIC
        if (this.addingBundleId !== null) {
            return;
        }

        this.addingBundleId = bundle.id;

        this.cartMessage = '';
        this.cartError = '';

        this.cartService
            .addBundle(bundle.id, 1)
            .subscribe({

                next: (cart: Cart) => {

                    this.cart = cart;
                    this.updateCartCount();

                    this.cartMessage =
                        `${bundle.name} a été ajouté au panier.`;

                    this.addingBundleId = null;

                    setTimeout(() => {
                        this.cartMessage = '';
                    }, 3000);
                },

                error: (error: any) => {

                    console.error(
                        'Erreur ajout pack au panier :',
                        error
                    );

                    this.addingBundleId = null;

                    // SESSION EXPIRÉE
                    if (error?.status === 401) {

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
            new Intl.NumberFormat('fr-FR').format(
                price ?? 0
            ) + ' FCFA'
        );
    }

    // ============================================================
    // FOCUS SEARCH
    // ============================================================

    focusSearch(): void {

        setTimeout(() => {

            const input = document.querySelector(
                'input[type="text"]'
            ) as HTMLInputElement | null;

            input?.focus();

        });
    }
}
