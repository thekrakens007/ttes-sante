import {
    Component,
    OnInit,
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
export class ProductsListComponent implements OnInit {

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
       PANIER
       ============================================================ */

    cart: Cart | null = null;

    cartLoading = false;

    addingToCartId: number | null = null;

    /* ============================================================
       INITIALISATION
       ============================================================ */

    ngOnInit(): void {
        this.loadFilterData();
        this.loadProducts();
        this.loadCart();
    }

    /* ============================================================
       FILTRES
       ============================================================ */

    loadFilterData(): void {

        this.loadingFilters = true;

        /*
         * Catégories
         */
        this.productService.getCategories().subscribe({
            next: (categories) => {
                this.categories = categories ?? [];
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
        this.productService.getCompanies().subscribe({
            next: (companies) => {
                this.companies = companies ?? [];
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
        this.productService.getTherapeuticAreas().subscribe({
            next: (areas) => {
                this.therapeuticAreas = areas ?? [];
                this.loadingFilters = false;
            },
            error: (err) => {
                console.error(
                    'Erreur lors du chargement des domaines thérapeutiques:',
                    err
                );

                this.therapeuticAreas = [];
                this.loadingFilters = false;
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
            this.searchTerm?.trim() || undefined;

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
                        this.currentPage >= this.totalPages
                    ) {
                        this.currentPage =
                            this.totalPages - 1;

                        this.loadProducts();

                        return;
                    }

                    this.loading = false;
                },

                error: (err) => {

                    console.error(
                        'Erreur lors du chargement des produits:',
                        err
                    );

                    this.products = [];

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

    onSearchKeydown(event: KeyboardEvent): void {

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

        this.selectedTherapeuticArea = null;

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

    /*
     * Ton HTML utilise "pages".
     *
     * On retourne ici les numéros de pages en base 0.
     */
    get pages(): number[] {

        if (this.totalPages <= 0) {
            return [];
        }

        return Array.from(
            { length: this.totalPages },
            (_, index) => index
        );
    }

    /* ============================================================
       INFORMATIONS PAGINATION
       ============================================================ */

    /*
     * Ton HTML utilise firstDisplayedProduct.
     *
     * Exemple :
     * page 0 / 8 produits => 1
     * page 1 / 8 produits => 9
     */
    get firstDisplayedProduct(): number {

        if (this.totalElements === 0) {
            return 0;
        }

        return (
            this.currentPage * this.pageSize
        ) + 1;
    }

    /*
     * Ton HTML utilise lastDisplayedProduct.
     */
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

        this.cartLoading = true;

        this.cartService.getCart().subscribe({

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

    /*
     * Ajouter un produit au panier.
     *
     * IMPORTANT :
     * CartService possède addItem(), pas addToCart().
     */
    addToCart(product: Product): void {

        if (!product?.id) {

            console.error(
                'Produit invalide:',
                product
            );

            return;
        }

        if (
            this.addingToCartId === product.id
        ) {
            return;
        }

        this.addingToCartId = product.id;

        this.cartService
            .addItem(product.id, 1)
            .subscribe({

                next: (cart) => {

                    /*
                     * addItem() retourne directement
                     * le panier mis à jour.
                     */
                    this.cart = cart;

                    this.addingToCartId = null;
                },

                error: (err) => {

                    console.error(
                        'Erreur lors de l’ajout au panier:',
                        err
                    );

                    this.addingToCartId = null;
                }
            });
    }

    /*
     * Ton HTML utilise cartCount.
     */
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
                    (Number(item.quantity) || 0)
                );
            },
            0
        );
    }

    /* ============================================================
       STOCK
       ============================================================ */

    isInStock(product: Product): boolean {

        return (
            (product.stock ?? 0) > 0
        );
    }

    isOutOfStock(product: Product): boolean {

        return (
            (product.stock ?? 0) <= 0
        );
    }

    getStockLabel(product: Product): string {

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

    getProductImage(
        product: Product
    ): string {

        if (
            product.images &&
            product.images.length > 0
        ) {

            /*
             * On utilise "any" ici parce que ton modèle
             * ProductImage semble exposer une structure dont
             * TypeScript déduit actuellement url comme {}.
             *
             * Cela évite l'erreur :
             * Type '{}' is not assignable to type 'string'.
             */
            const firstImage: any =
                product.images[0];

            /*
             * Image stockée directement comme string.
             */
            if (
                typeof firstImage === 'string'
            ) {
                return firstImage;
            }

            /*
             * Structure :
             * { url: "..." }
             */
            if (
                firstImage?.url &&
                typeof firstImage.url === 'string'
            ) {
                return firstImage.url;
            }

            /*
             * Structure :
             * { imageUrl: "..." }
             */
            if (
                firstImage?.imageUrl &&
                typeof firstImage.imageUrl === 'string'
            ) {
                return firstImage.imageUrl;
            }

            /*
             * Structure éventuelle :
             * { path: "..." }
             */
            if (
                firstImage?.path &&
                typeof firstImage.path === 'string'
            ) {
                return firstImage.path;
            }
        }

        return '/images/products/default-product.jpg';
    }

    /* ============================================================
       ERREUR IMAGE
       ============================================================ */

    onImageError(event: Event): void {

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
