import {
    Component,
    OnInit,
    OnDestroy,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { Product } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';

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
export class ProductsListComponent implements OnInit, OnDestroy {

    private readonly productService = inject(ProductService);
    private readonly cartService = inject(CartService);
    private readonly router = inject(Router);

    /* ============================================================
       PRODUITS
       ============================================================ */

    products: Product[] = [];

    loading = true;
    error = '';

    /* ============================================================
       CARROUSEL PRODUITS ALÉATOIRES
       ============================================================ */

    /**
     * Produits affichés dans le carrousel supérieur.
     */
    featuredProducts: Product[] = [];

    /**
     * Index du produit actuellement affiché.
     */
    featuredCurrentIndex = 0;

    /**
     * Timer du défilement automatique.
     */
    private featuredInterval: ReturnType<typeof setInterval> | null = null;

    /**
     * Nombre de produits visibles simultanément
     * selon la largeur de l'écran.
     */
    featuredVisibleCount = 4;

    /* ============================================================
       PAGINATION
       ============================================================ */

    totalElements = 0;
    totalPages = 0;

    currentPage = 0;
    pageSize = 8;

    /* ============================================================
       RECHERCHE
       ============================================================ */

    searchTerm = '';

    /* ============================================================
       FILTRES
       ============================================================ */

    selectedCategory: number | null = null;

    selectedCompany: number | null = null;

    selectedTherapeuticArea: number | null = null;

    categories: any[] = [];

    companies: any[] = [];

    therapeuticAreas: any[] = [];

    loadingFilters = false;

    /* ============================================================
       MENU MOBILE
       ============================================================ */

    mobileMenuOpen = false;

    /* ============================================================
       PANIER
       ============================================================ */

    cart: Cart | null = null;

    cartLoading = false;

    addingProductId: number | null = null;

    cartMessage = '';

    cartError = '';

    /* ============================================================
       FOOTER
       ============================================================ */

    currentYear = new Date().getFullYear();

    /* ============================================================
       INITIALISATION
       ============================================================ */

    ngOnInit(): void {

        this.loadFilterData();

        this.loadProducts();

        this.loadCart();

        /*
         * Défilement automatique du carrousel.
         */
        this.startFeaturedCarousel();
    }

    /* ============================================================
       DESTRUCTION
       ============================================================ */

    ngOnDestroy(): void {

        this.stopFeaturedCarousel();
    }

    /* ============================================================
       CARROUSEL PRODUITS
       ============================================================ */

    /**
     * Mélange un tableau de manière aléatoire.
     */
    private shuffleProducts(
        products: Product[]
    ): Product[] {

        const shuffled = [...products];

        for (
            let i = shuffled.length - 1;
            i > 0;
            i--
        ) {

            const j =
                Math.floor(
                    Math.random() * (i + 1)
                );

            [
                shuffled[i],
                shuffled[j]
            ] = [
                shuffled[j],
                shuffled[i]
            ];
        }

        return shuffled;
    }

    /**
     * Prépare les produits du carrousel.
     */
    private prepareFeaturedProducts(): void {

        if (!this.products || this.products.length === 0) {

            this.featuredProducts = [];

            this.featuredCurrentIndex = 0;

            return;
        }

        /*
         * Mélange les produits actuellement chargés.
         */
        const shuffled =
            this.shuffleProducts(this.products);

        /*
         * On affiche au maximum 8 produits
         * dans le carrousel.
         */
        this.featuredProducts =
            shuffled.slice(0, 8);

        this.featuredCurrentIndex = 0;
    }

    /**
     * Démarre le défilement automatique.
     */
    private startFeaturedCarousel(): void {

        this.stopFeaturedCarousel();

        this.featuredInterval =
            setInterval(() => {

                this.nextFeaturedProduct();

            }, 3000);
    }

    /**
     * Arrête le défilement automatique.
     */
    private stopFeaturedCarousel(): void {

        if (this.featuredInterval !== null) {

            clearInterval(
                this.featuredInterval
            );

            this.featuredInterval = null;
        }
    }

    /**
     * Produit suivant.
     */
    nextFeaturedProduct(): void {

        if (
            !this.featuredProducts ||
            this.featuredProducts.length === 0
        ) {
            return;
        }

        this.featuredCurrentIndex++;

        /*
         * Retour au début.
         */
        if (
            this.featuredCurrentIndex >=
            this.featuredProducts.length
        ) {

            this.featuredCurrentIndex = 0;
        }
    }

    /**
     * Produit précédent.
     */
    previousFeaturedProduct(): void {

        if (
            !this.featuredProducts ||
            this.featuredProducts.length === 0
        ) {
            return;
        }

        this.featuredCurrentIndex--;

        if (
            this.featuredCurrentIndex < 0
        ) {

            this.featuredCurrentIndex =
                this.featuredProducts.length - 1;
        }
    }

    /**
     * Produit actuellement affiché.
     */
    getCurrentFeaturedProduct(): Product | null {

        if (
            !this.featuredProducts ||
            this.featuredProducts.length === 0
        ) {
            return null;
        }

        return this.featuredProducts[
            this.featuredCurrentIndex
        ];
    }

    /**
     * Produits affichés dans le carrousel.
     *
     * Cette méthode permet d'afficher plusieurs cartes
     * selon la taille de l'écran.
     */
    getVisibleFeaturedProducts(): Product[] {

        if (
            !this.featuredProducts ||
            this.featuredProducts.length === 0
        ) {
            return [];
        }

        const result: Product[] = [];

        const count =
            Math.min(
                this.featuredVisibleCount,
                this.featuredProducts.length
            );

        for (
            let i = 0;
            i < count;
            i++
        ) {

            const index =
                (
                    this.featuredCurrentIndex +
                    i
                ) %
                this.featuredProducts.length;

            result.push(
                this.featuredProducts[index]
            );
        }

        return result;
    }

    /**
     * Change le produit affiché par le carrousel.
     */
    selectFeaturedProduct(
        index: number
    ): void {

        if (
            index < 0 ||
            index >= this.featuredProducts.length
        ) {
            return;
        }

        this.featuredCurrentIndex = index;
    }

    /**
     * Navigation vers un produit depuis le carrousel.
     */
    viewFeaturedProduct(
        product: Product
    ): void {

        this.viewProduct(product);
    }

    /**
     * Pause temporaire lors du survol.
     */
    pauseFeaturedCarousel(): void {

        this.stopFeaturedCarousel();
    }

    /**
     * Reprise après le survol.
     */
    resumeFeaturedCarousel(): void {

        this.startFeaturedCarousel();
    }

    /* ============================================================
       MENU MOBILE
       ============================================================ */

    toggleMobileMenu(): void {

        this.mobileMenuOpen =
            !this.mobileMenuOpen;
    }

    closeMobileMenu(): void {

        this.mobileMenuOpen = false;
    }

    /* ============================================================
       AUTHENTIFICATION
       ============================================================ */

    isLoggedIn(): boolean {

        return !!localStorage.getItem(
            'ttes_icg_sante_token'
        );
    }

    logout(): void {

        localStorage.removeItem(
            'ttes_icg_sante_token'
        );

        this.cart = null;

        this.closeMobileMenu();

        this.router.navigate([
            '/signin'
        ]);
    }

    /* ============================================================
       FILTRES
       ============================================================ */

    loadFilterData(): void {

        this.loadingFilters = true;

        /*
         * Catégories
         */
        this.productService
            .getCategories()
            .subscribe({

                next: (categories) => {

                    this.categories =
                        categories ?? [];
                },

                error: (err) => {

                    console.error(
                        'Erreur lors du chargement des catégories:',
                        err
                    );

                    this.categories = [];
                }
            });

        /*
         * Entreprises
         */
        this.productService
            .getCompanies()
            .subscribe({

                next: (companies) => {

                    this.companies =
                        companies ?? [];
                },

                error: (err) => {

                    console.error(
                        'Erreur lors du chargement des entreprises:',
                        err
                    );

                    this.companies = [];
                }
            });

        /*
         * Domaines thérapeutiques
         */
        this.productService
            .getTherapeuticAreas()
            .subscribe({

                next: (areas) => {

                    this.therapeuticAreas =
                        areas ?? [];

                    this.loadingFilters =
                        false;
                },

                error: (err) => {

                    console.error(
                        'Erreur lors du chargement des domaines thérapeutiques:',
                        err
                    );

                    this.therapeuticAreas = [];

                    this.loadingFilters =
                        false;
                }
            });
    }

    /* ============================================================
       PRODUITS
       ============================================================ */

    loadProducts(): void {

        this.loading = true;

        this.error = '';

        const keyword =
            this.searchTerm?.trim() ||
            undefined;

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

                next: (response) => {

                    this.products =
                        response?.content ?? [];

                    this.totalElements =
                        response?.totalElements ?? 0;

                    this.totalPages =
                        response?.totalPages ?? 0;

                    /*
                     * Si la page demandée n'existe plus,
                     * revenir sur la dernière page.
                     */
                    if (
                        this.totalPages > 0 &&
                        this.currentPage >=
                        this.totalPages
                    ) {

                        this.currentPage =
                            this.totalPages - 1;

                        this.loadProducts();

                        return;
                    }

                    /*
                     * Préparation du carrousel.
                     */
                    this.prepareFeaturedProducts();

                    this.loading = false;
                },

                error: (err) => {

                    console.error(
                        'Erreur lors du chargement des produits:',
                        err
                    );

                    this.products = [];

                    this.featuredProducts = [];

                    this.totalElements = 0;

                    this.totalPages = 0;

                    this.error =
                        'Impossible de charger les produits. Veuillez réessayer.';

                    this.loading = false;
                }
            });
    }

    /* ============================================================
       RECHERCHE
       ============================================================ */

    submitSearch(): void {

        this.currentPage = 0;

        this.loadProducts();
    }

    onSearchKeydown(
        event: KeyboardEvent
    ): void {

        if (event.key === 'Enter') {

            event.preventDefault();

            this.submitSearch();
        }
    }

    /* ============================================================
       FILTRES
       ============================================================ */

    onFilterChange(): void {

        this.currentPage = 0;

        this.loadProducts();
    }

    /* ============================================================
       RESET
       ============================================================ */

    resetFilters(): void {

        this.searchTerm = '';

        this.selectedCategory = null;

        this.selectedCompany = null;

        this.selectedTherapeuticArea =
            null;

        this.currentPage = 0;

        this.loadProducts();
    }

    /* ============================================================
       PAGINATION
       ============================================================ */

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

    getPaginationPages(): number[] {

        if (this.totalPages <= 0) {
            return [];
        }

        return Array.from(
            {
                length: this.totalPages
            },
            (_, index) => index
        );
    }

    get pages(): number[] {

        return this.getPaginationPages();
    }

    /* ============================================================
       INFORMATIONS PAGINATION
       ============================================================ */

    get firstDisplayedProduct(): number {

        if (this.totalElements === 0) {
            return 0;
        }

        return (
            this.currentPage *
            this.pageSize
        ) + 1;
    }

    get lastDisplayedProduct(): number {

        if (this.totalElements === 0) {
            return 0;
        }

        return Math.min(
            (
                this.currentPage + 1
            ) * this.pageSize,
            this.totalElements
        );
    }

    /* ============================================================
       PANIER
       ============================================================ */

    loadCart(): void {

        if (!this.isLoggedIn()) {

            this.cart = null;

            return;
        }

        this.cartLoading = true;

        this.cartService
            .getCart()
            .subscribe({

                next: (cart) => {

                    this.cart = cart;

                    this.cartLoading = false;
                },

                error: (err) => {

                    console.error(
                        'Erreur lors du chargement du panier:',
                        err
                    );

                    this.cart = null;

                    this.cartLoading = false;
                }
            });
    }

    addToCart(
        product: Product
    ): void {

        if (!this.isLoggedIn()) {

            this.router.navigate([
                '/signin'
            ]);

            return;
        }

        if (!product?.id) {

            console.error(
                'Produit invalide:',
                product
            );

            return;
        }

        if (
            this.addingProductId ===
            product.id
        ) {
            return;
        }

        this.cartMessage = '';

        this.cartError = '';

        this.addingProductId =
            product.id;

        this.cartService
            .addItem(
                product.id,
                1
            )
            .subscribe({

                next: (cart) => {

                    this.cart = cart;

                    this.addingProductId =
                        null;

                    this.cartMessage =
                        `${product.name} a été ajouté au panier.`;

                    setTimeout(() => {

                        this.cartMessage = '';

                    }, 3000);
                },

                error: (err) => {

                    console.error(
                        'Erreur lors de l’ajout au panier:',
                        err
                    );

                    this.addingProductId =
                        null;

                    this.cartError =
                        'Impossible d’ajouter le produit au panier.';

                    setTimeout(() => {

                        this.cartError = '';

                    }, 4000);
                }
            });
    }

    get cartCount(): number {

        if (
            !this.cart ||
            !this.cart.items
        ) {
            return 0;
        }

        return this.cart.items.reduce(
            (
                total: number,
                item: any
            ) => {

                return (
                    total +
                    (
                        Number(
                            item.quantity
                        ) || 0
                    )
                );
            },
            0
        );
    }

    getProductCartQuantity(
        productId: number
    ): number {

        if (
            !this.cart ||
            !this.cart.items
        ) {
            return 0;
        }

        const item =
            this.cart.items.find(
                (cartItem: any) => {

                    if (
                        Number(
                            cartItem?.productId
                        ) ===
                        Number(productId)
                    ) {
                        return true;
                    }

                    if (
                        Number(
                            cartItem?.product?.id
                        ) ===
                        Number(productId)
                    ) {
                        return true;
                    }

                    if (
                        Number(
                            cartItem?.product?.productId
                        ) ===
                        Number(productId)
                    ) {
                        return true;
                    }

                    return false;
                }
            );

        if (!item) {
            return 0;
        }

        return (
            Number(item.quantity) || 0
        );
    }

    /* ============================================================
       STOCK
       ============================================================ */

    isInStock(
        product: Product
    ): boolean {

        return (
            (product.stock ?? 0) > 0
        );
    }

    isOutOfStock(
        product: Product
    ): boolean {

        return (
            (product.stock ?? 0) <= 0
        );
    }

    isLowStock(
        product: Product
    ): boolean {

        const stock =
            product.stock ?? 0;

        return (
            stock > 0 &&
            stock <= 5
        );
    }

    getStockLabel(
        product: Product
    ): string {

        const stock =
            product.stock ?? 0;

        if (stock <= 0) {
            return 'Rupture de stock';
        }

        if (stock <= 5) {
            return `Plus que ${stock}`;
        }

        return 'En stock';
    }

    /* ============================================================
       PRIX
       ============================================================ */

    formatPrice(
        price: number | null | undefined
    ): string {

        if (
            price === null ||
            price === undefined
        ) {
            return '0 FCFA';
        }

        return `${new Intl.NumberFormat(
            'fr-FR'
        ).format(price)} FCFA`;
    }

    /* ============================================================
       IMAGE PRODUIT
       ============================================================ */

    getMainImage(
        product: Product
    ): string {

        if (
            product.images &&
            product.images.length > 0
        ) {

            const firstImage: any =
                product.images[0];

            if (
                typeof firstImage === 'string'
            ) {
                return firstImage;
            }

            if (
                firstImage?.url &&
                typeof firstImage.url === 'string'
            ) {
                return firstImage.url;
            }

            if (
                firstImage?.imageUrl &&
                typeof firstImage.imageUrl === 'string'
            ) {
                return firstImage.imageUrl;
            }

            if (
                firstImage?.path &&
                typeof firstImage.path === 'string'
            ) {
                return firstImage.path;
            }
        }

        return '/images/products/default-product.jpg';
    }

    getProductImage(
        product: Product
    ): string {

        return this.getMainImage(product);
    }

    onImageError(
        event: Event
    ): void {

        const image =
            event.target as HTMLImageElement;

        if (!image) {
            return;
        }

        image.src =
            '/images/products/default-product.jpg';
    }

    /* ============================================================
       CATÉGORIES
       ============================================================ */

    getCategoryNames(
        product: Product
    ): string {

        if (
            !product.categories ||
            product.categories.length === 0
        ) {
            return 'Non catégorisé';
        }

        return product.categories
            .map((category: any) => {

                if (
                    typeof category === 'string'
                ) {
                    return category;
                }

                return category?.name ?? '';
            })
            .filter(Boolean)
            .join(', ');
    }

    /* ============================================================
       DOMAINES THÉRAPEUTIQUES
       ============================================================ */

    getTherapeuticAreaNames(
        product: Product
    ): string {

        if (
            !product.therapeuticAreas ||
            product.therapeuticAreas.length === 0
        ) {
            return 'Non défini';
        }

        return product.therapeuticAreas
            .map((area: any) => {

                if (
                    typeof area === 'string'
                ) {
                    return area;
                }

                return area?.name ?? '';
            })
            .filter(Boolean)
            .join(', ');
    }

    /* ============================================================
       ENTREPRISE
       ============================================================ */

    getCompanyName(
        product: Product
    ): string {

        return (
            product.companyName ||
            'Entreprise non définie'
        );
    }

    /* ============================================================
       NAVIGATION
       ============================================================ */

    viewProduct(
        product: Product
    ): void {

        if (!product?.id) {
            return;
        }

        this.router.navigate([
            '/products',
            product.id
        ]);
    }
}
