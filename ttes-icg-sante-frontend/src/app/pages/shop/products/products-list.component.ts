import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.model';

import { ProductCardComponent } from '../../../shared/components/client/product-card/product-card.component';

import { CartService } from '../../../core/services/cart.service';
import { CartResponse } from '../../../core/interfaces/cart.interface';

import { AuthService } from '../../../core/services/auth.service';

import { BundleService } from '../../../core/services/bundle.service';
import { BundleResponse } from '../../../core/interfaces/bundle-response.interface';


@Component({
    selector: 'app-products-page',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ProductCardComponent
    ],
    templateUrl: './products-list.component.html'
})
export class ProductsListComponent implements OnInit {

    // ============================================================
    // PAGINATION
    // ============================================================

    currentPage = 0;

    pageSize = 8;

    totalPages = 0;

    totalElements = 0;

    pages: number[] = [];


    // ============================================================
    // GENERAL
    // ============================================================

    currentYear = new Date().getFullYear();

    mobileMenuOpen = false;


    // ============================================================
    // SERVICES
    // ============================================================

    private productService = inject(ProductService);

    private cartService = inject(CartService);

    private authService = inject(AuthService);

    private bundleService = inject(BundleService);


    // ============================================================
    // CART
    // ============================================================

    cart: CartResponse | null = null;


    // ============================================================
    // PRODUCTS
    // ============================================================

    products: Product[] = [];

    filteredProducts: Product[] = [];


    // ============================================================
    // BUNDLES / PACKS
    // ============================================================

    bundles: BundleResponse[] = [];

    bundlesLoading = true;

    bundlesError = '';


    // ============================================================
    // SEARCH
    // ============================================================

    searchTerm = '';


    // ============================================================
    // FILTERS
    // ============================================================

    selectedCategory = '';

    selectedCompany = '';

    selectedTherapeuticArea = '';

    categories: string[] = [];

    companies: string[] = [];

    therapeuticAreas: string[] = [];


    // ============================================================
    // LOADING / ERROR
    // ============================================================

    loading = true;

    error = '';


    // ============================================================
    // INIT
    // ============================================================

    ngOnInit(): void {

        this.loadProducts();

        this.loadBundles();

        if (this.isLoggedIn()) {
            this.loadCart();
        }
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
    // BUNDLES
    // ============================================================

    loadBundles(): void {

        this.bundlesLoading = true;

        this.bundlesError = '';

        this.bundleService
            .getBundles()
            .subscribe({

                next: (bundles) => {

                    this.bundles =
                        (bundles ?? []).slice(0, 4);

                    this.bundlesLoading = false;
                },

                error: (error) => {

                    console.error(
                        'Erreur lors du chargement des packs',
                        error
                    );

                    this.bundles = [];

                    this.bundlesError =
                        'Impossible de charger les packs.';

                    this.bundlesLoading = false;
                }
            });
    }


    // ============================================================
    // IMAGE PRINCIPALE D'UN BUNDLE
    // ============================================================

    getBundleImage(
        bundle: BundleResponse
    ): string {

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
            mainImage?.imageUrl ||
            bundle.images[0]?.imageUrl ||
            '/images/products/default-product.png'
        );
    }


    // ============================================================
    // NOMBRE DE PRODUITS DANS UN BUNDLE
    // ============================================================

    getBundleItemCount(
        bundle: BundleResponse
    ): number {

        return bundle.items?.length ?? 0;
    }


    // ============================================================
    // DISPONIBILITÉ D'UN BUNDLE
    // ============================================================

    isBundleAvailable(
        bundle: BundleResponse
    ): boolean {

        return (
            bundle.stock !== undefined &&
            bundle.stock > 0
        );
    }


    // ============================================================
    // CART
    // ============================================================

    loadCart(): void {

        if (!this.isLoggedIn()) {

            this.cart = null;

            return;
        }

        this.cartService
            .getCart()
            .subscribe({

                next: (cart) => {

                    this.cart = cart;
                },

                error: (error) => {

                    console.error(
                        'Erreur chargement panier',
                        error
                    );

                    this.cart = null;
                }
            });
    }


    // ============================================================
    // PRODUCTS
    // ============================================================

    loadProducts(): void {

        this.loading = true;

        this.error = '';

        this.productService
            .getProductsPaginated(
                this.currentPage,
                this.pageSize
            )
            .subscribe({

                next: (response) => {

                    // Produits disponibles uniquement
                    this.products = (
                        response.content ?? []
                    ).filter(
                        product =>
                            product.stock > 0
                    );


                    // Pagination
                    this.totalPages =
                        response.totalPages ?? 0;

                    this.totalElements =
                        response.totalElements ?? 0;


                    this.pages = Array.from(
                        {
                            length: this.totalPages
                        },
                        (_, index) => index
                    );


                    // Filtres
                    this.buildFilters();


                    // Produits filtrés
                    this.filteredProducts = [
                        ...this.products
                    ];


                    this.search();


                    this.loading = false;
                },

                error: (error) => {

                    console.error(
                        'Erreur lors du chargement des produits',
                        error
                    );

                    this.products = [];

                    this.filteredProducts = [];

                    this.totalPages = 0;

                    this.totalElements = 0;

                    this.pages = [];

                    this.error =
                        'Impossible de charger les produits.';

                    this.loading = false;
                }
            });
    }


    // ============================================================
    // PAGINATION
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

        this.loadProducts();

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

            this.loadProducts();

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }


    previousPage(): void {

        if (this.currentPage > 0) {

            this.currentPage--;

            this.loadProducts();

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }


    // ============================================================
    // CONSTRUCTION DES FILTRES
    // ============================================================

    buildFilters(): void {

        // ----------------------------
        // Categories
        // ----------------------------

        const categories =
            this.products.flatMap(
                product =>
                    product.categories ?? []
            );


        // ----------------------------
        // Companies
        // ----------------------------

        const companies: string[] =
            this.products
                .map(
                    product =>
                        product.companyName
                )
                .filter(
                    (
                        value
                    ): value is string =>
                        !!value
                );


        // ----------------------------
        // Therapeutic areas
        // ----------------------------

        const therapeuticAreas =
            this.products.flatMap(
                product =>
                    product.therapeuticAreas ?? []
            );


        // ----------------------------
        // Suppression des doublons
        // ----------------------------

        this.categories = [
            ...new Set(categories)
        ].sort();

        this.companies = [
            ...new Set(companies)
        ].sort();

        this.therapeuticAreas = [
            ...new Set(therapeuticAreas)
        ].sort();
    }


    // ============================================================
    // SEARCH + FILTERS
    // ============================================================

    search(): void {

        const term =
            this.searchTerm
                .trim()
                .toLowerCase();


        this.filteredProducts =
            this.products.filter(
                product => {

                    // ----------------------------
                    // Recherche
                    // ----------------------------

                    const matchesSearch =
                        !term ||

                        product.name
                            ?.toLowerCase()
                            .includes(term) ||

                        product.brand
                            ?.toLowerCase()
                            .includes(term) ||

                        product.description
                            ?.toLowerCase()
                            .includes(term) ||

                        product.categories?.some(
                            category =>
                                category
                                    .toLowerCase()
                                    .includes(term)
                        ) ||

                        product.companyName
                            ?.toLowerCase()
                            .includes(term) ||

                        product.therapeuticAreas?.some(
                            area =>
                                area
                                    .toLowerCase()
                                    .includes(term)
                        );


                    // ----------------------------
                    // Catégorie
                    // ----------------------------

                    const matchesCategory =
                        !this.selectedCategory ||
                        product.categories?.includes(
                            this.selectedCategory
                        );


                    // ----------------------------
                    // Entreprise
                    // ----------------------------

                    const matchesCompany =
                        !this.selectedCompany ||
                        product.companyName ===
                        this.selectedCompany;


                    // ----------------------------
                    // Domaine thérapeutique
                    // ----------------------------

                    const matchesTherapeuticArea =
                        !this.selectedTherapeuticArea ||
                        product.therapeuticAreas?.includes(
                            this.selectedTherapeuticArea
                        );


                    return (
                        matchesSearch &&
                        matchesCategory &&
                        matchesCompany &&
                        matchesTherapeuticArea
                    );
                }
            );
    }


    // ============================================================
    // RESET FILTERS
    // ============================================================

    resetFilters(): void {

        this.searchTerm = '';

        this.selectedCategory = '';

        this.selectedCompany = '';

        this.selectedTherapeuticArea = '';

        this.filteredProducts = [
            ...this.products
        ];
    }


    // ============================================================
    // CART - PRODUCT
    // ============================================================

    isProductInCart(
        productId: number
    ): boolean {

        if (!this.cart?.items) {
            return false;
        }

        return this.cart.items.some(
            item =>
                item.productId === productId
        );
    }


    getProductQuantity(
        productId: number
    ): number {

        if (!this.cart?.items) {
            return 0;
        }

        const item =
            this.cart.items.find(
                item =>
                    item.productId === productId
            );

        return item?.quantity ?? 0;
    }


    // ============================================================
    // ADD PRODUCT TO CART
    // ============================================================

    addToCart(product: Product): void {
        if (!product?.id) {
            console.error('Produit invalide');
            return;
        }

        this.cartService
            .addItem(product.id, 1)
            .subscribe({
                next: (cart) => {
                    this.cart = cart;

                    console.log(
                        'Produit ajouté au panier :',
                        product.name
                    );
                },
                error: (error) => {
                    console.error(
                        'Erreur lors de l’ajout au panier :',
                        error
                    );
                }
            });
    }


    // ============================================================
    // PRODUCT IMAGE
    // ============================================================

    getMainImage(
        product: Product
    ): string {

        if (
            !product.images ||
            product.images.length === 0
        ) {

            return '/images/products/default-product.png';
        }

        const mainImage =
            product.images.find(
                image => image.main
            );

        return (
            mainImage?.imageUrl ||
            product.images[0]?.imageUrl ||
            '/images/products/default-product.png'
        );
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
}