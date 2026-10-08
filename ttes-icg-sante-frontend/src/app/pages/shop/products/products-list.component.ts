import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import {
    Product,
    ProductPage
} from '../../../core/models/product.model';

import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';

import { Cart } from '../../../core/interfaces/cart.interface';

@Component({
    selector: 'app-products-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule
    ],
    templateUrl: './products-list.component.html'
})
export class ProductsListComponent implements OnInit {

    private productService = inject(ProductService);
    private cartService = inject(CartService);
    private authService = inject(AuthService);
    private router = inject(Router);

    // =========================================================
    // PRODUITS
    // =========================================================

    products: Product[] = [];

    loading = true;
    error = '';

    totalElements = 0;
    totalPages = 0;

    currentPage = 0;
    pageSize = 8;

    // =========================================================
    // RECHERCHE
    // =========================================================

    searchTerm = '';

    // =========================================================
    // FILTRES
    // =========================================================

    selectedCategory: number | null = null;
    selectedCompany: number | null = null;
    selectedTherapeuticArea: number | null = null;

    categories: any[] = [];
    companies: any[] = [];
    therapeuticAreas: any[] = [];

    loadingFilters = false;

    // =========================================================
    // PANIER
    // =========================================================

    cart: Cart | null = null;
    cartCount = 0;

    addingProductId: number | null = null;

    cartMessage = '';
    cartError = '';

    // =========================================================
    // MENU
    // =========================================================

    mobileMenuOpen = false;

    currentYear = new Date().getFullYear();

    // =========================================================
    // INITIALISATION
    // =========================================================

    ngOnInit(): void {

        this.loadFilterData();

        this.loadProducts();

        this.loadCart();
    }

    // =========================================================
    // AUTH
    // =========================================================

    isLoggedIn(): boolean {
        return this.authService.isLoggedIn();
    }

    isAdmin(): boolean {

        if (!this.isLoggedIn()) {
            return false;
        }

        return this.authService.hasRole('ROLE_ADMIN');
    }

    logout(): void {

        this.authService.logout();

        this.cart = null;
        this.cartCount = 0;

        this.cartMessage = '';
        this.cartError = '';

        this.closeMobileMenu();

        this.router.navigate(['/']);
    }

    // =========================================================
    // MENU MOBILE
    // =========================================================

    toggleMobileMenu(): void {
        this.mobileMenuOpen = !this.mobileMenuOpen;
    }

    closeMobileMenu(): void {
        this.mobileMenuOpen = false;
    }

    // =========================================================
    // CHARGEMENT DES FILTRES
    // =========================================================

    loadFilterData(): void {

        this.loadingFilters = true;

        /*
         * Ces 3 méthodes doivent exister dans ProductService.
         *
         * Si tes services CategoryService / CompanyService /
         * TherapeuticAreaService existent déjà, on pourra les
         * utiliser à la place.
         */

        this.productService.getCategories().subscribe({
            next: (data: any[]) => {
                this.categories = data ?? [];
            },

            error: (error) => {
                console.error(
                    'Erreur chargement catégories :',
                    error
                );

                this.categories = [];
            }
        });

        this.productService.getCompanies().subscribe({
            next: (data: any[]) => {
                this.companies = data ?? [];
            },

            error: (error) => {
                console.error(
                    'Erreur chargement entreprises :',
                    error
                );

                this.companies = [];
            }
        });

        this.productService.getTherapeuticAreas().subscribe({
            next: (data: any[]) => {
                this.therapeuticAreas = data ?? [];
            },

            error: (error) => {
                console.error(
                    'Erreur chargement domaines thérapeutiques :',
                    error
                );

                this.therapeuticAreas = [];
            }
        });

        this.loadingFilters = false;
    }

    // =========================================================
    // PRODUITS
    // =========================================================

    loadProducts(): void {

        this.loading = true;
        this.error = '';

        const keyword = this.searchTerm.trim();

        this.productService
            .getProductsPaginated(
                this.currentPage,
                this.pageSize,
                keyword,
                this.selectedCategory,
                this.selectedCompany,
                this.selectedTherapeuticArea
            )
            .subscribe({

                next: (response: ProductPage) => {

                    this.products =
                        response?.content ?? [];

                    this.totalElements =
                        response?.totalElements ?? 0;

                    this.totalPages =
                        response?.totalPages ?? 0;

                    this.loading = false;
                },

                error: (error: any) => {

                    console.error(
                        'Erreur chargement produits :',
                        error
                    );

                    this.products = [];

                    this.totalElements = 0;
                    this.totalPages = 0;

                    this.error =
                        error?.error?.message ??
                        'Impossible de charger les produits.';

                    this.loading = false;
                }
            });
    }

    // =========================================================
    // RECHERCHE
    // =========================================================

    submitSearch(): void {

        this.currentPage = 0;

        this.loadProducts();
    }

    clearSearch(): void {

        this.searchTerm = '';

        this.currentPage = 0;

        this.loadProducts();
    }

    // =========================================================
    // FILTRES
    // =========================================================

    onFilterChange(): void {

        this.currentPage = 0;

        this.loadProducts();
    }

    resetFilters(): void {

        this.searchTerm = '';

        this.selectedCategory = null;

        this.selectedCompany = null;

        this.selectedTherapeuticArea = null;

        this.currentPage = 0;

        this.loadProducts();
    }

    // =========================================================
    // PAGINATION
    // =========================================================

    previousPage(): void {

        if (this.currentPage <= 0) {
            return;
        }

        this.currentPage--;

        this.loadProducts();

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
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

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    goToPage(page: number): void {

        if (
            page < 0 ||
            page >= this.totalPages ||
            page === this.currentPage
        ) {
            return;
        }

        this.currentPage = page;

        this.loadProducts();

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    getPaginationPages(): number[] {

        if (this.totalPages <= 0) {
            return [];
        }

        const pages: number[] = [];

        const maxVisiblePages = 5;

        let start = Math.max(
            0,
            this.currentPage -
            Math.floor(maxVisiblePages / 2)
        );

        const end = Math.min(
            this.totalPages,
            start + maxVisiblePages
        );

        if (
            end - start <
            maxVisiblePages
        ) {
            start = Math.max(
                0,
                end - maxVisiblePages
            );
        }

        for (
            let page = start;
            page < end;
            page++
        ) {
            pages.push(page);
        }

        return pages;
    }

    // =========================================================
    // PANIER
    // =========================================================

    loadCart(): void {

        if (!this.authService.isLoggedIn()) {

            this.cart = null;
            this.cartCount = 0;

            return;
        }

        this.cartService
            .getCart()
            .subscribe({

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

    updateCartCount(): void {

        if (!this.cart?.items) {

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
                    (item.quantity ?? 0),
                0
            );
    }

    getProductCartQuantity(
        productId: number
    ): number {

        if (!this.cart?.items) {
            return 0;
        }

        const item =
            this.cart.items.find(
                (cartItem: any) =>
                    cartItem.productId === productId ||
                    cartItem.product?.id === productId
            );

        return item?.quantity ?? 0;
    }

    addToCart(product: Product): void {

        if (!this.authService.isLoggedIn()) {

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

        if (
            product.stock === undefined ||
            product.stock <= 0
        ) {

            this.cartError =
                'Ce produit est actuellement en rupture de stock.';

            this.cartMessage = '';

            return;
        }

        if (
            this.addingProductId === product.id
        ) {
            return;
        }

        this.addingProductId =
            product.id;

        this.cartMessage = '';
        this.cartError = '';

        this.cartService
            .addItem(product.id, 1)
            .subscribe({

                next: (cart: Cart) => {

                    this.cart = cart;

                    this.updateCartCount();

                    this.addingProductId = null;

                    this.cartMessage =
                        'Produit ajouté au panier.';

                    this.cartError = '';
                },

                error: (error: any) => {

                    console.error(
                        'Erreur ajout produit au panier :',
                        error
                    );

                    this.addingProductId = null;

                    if (error?.status === 401) {

                        this.authService.logout();

                        this.cart = null;
                        this.cartCount = 0;

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
                        'Impossible d’ajouter le produit au panier.';

                    this.cartMessage = '';
                }
            });
    }

    // =========================================================
    // PRODUIT
    // =========================================================

    getMainImage(product: Product): string {

        if (
            product.images &&
            product.images.length > 0
        ) {

            const mainImage =
                product.images.find(
                    image => image.main
                );

            return (
                mainImage?.imageUrl ??
                product.images[0]?.imageUrl ??
                '/images/products/default-product.png'
            );
        }

        return '/images/products/default-product.png';
    }

    isOutOfStock(product: Product): boolean {

        return (
            product.stock === undefined ||
            product.stock <= 0
        );
    }

    isLowStock(product: Product): boolean {

        return (
            product.stock > 0 &&
            product.stock <= 5
        );
    }

    formatPrice(
        price: number | undefined | null
    ): string {

        return (
            new Intl.NumberFormat(
                'fr-FR'
            ).format(price ?? 0) +
            ' FCFA'
        );
    }

    getProductCategories(
        product: Product
    ): string[] {

        return product.categories ?? [];
    }

    getProductTherapeuticAreas(
        product: Product
    ): string[] {

        return product.therapeuticAreas ?? [];
    }

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
