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
    Product,
    ProductPage
} from '../../../core/models/product.model';

import {
    ProductService
} from '../../../core/services/product.service';

import {
    CartService
} from '../../../core/services/cart.service';


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

    // =========================================================
    // SERVICES
    // =========================================================

    private readonly productService =
        inject(ProductService);

    private readonly cartService =
        inject(CartService);

    private readonly router =
        inject(Router);


    // =========================================================
    // PRODUITS
    // =========================================================

    products: Product[] = [];

    loading = true;

    error = '';


    // =========================================================
    // PAGINATION
    // =========================================================

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


    // =========================================================
    // DONNÉES DES FILTRES
    // =========================================================

    categories: any[] = [];

    companies: any[] = [];

    therapeuticAreas: any[] = [];


    // =========================================================
    // PANIER
    // =========================================================

    cartCount = 0;


    // =========================================================
    // INITIALISATION
    // =========================================================

    ngOnInit(): void {

        this.loadFilterData();

        this.loadProducts();

        this.loadCart();
    }


    // =========================================================
    // CHARGEMENT DES FILTRES
    // =========================================================

    loadFilterData(): void {

        // -----------------------------------------------------
        // CATÉGORIES
        // -----------------------------------------------------

        this.productService
            .getCategories()
            .subscribe({

                next: (data: any[]) => {

                    console.log(
                        'Catégories reçues :',
                        data
                    );

                    this.categories =
                        Array.isArray(data)
                            ? data
                            : [];
                },

                error: (error: any) => {

                    console.error(
                        'Erreur chargement catégories :',
                        error
                    );

                    this.categories = [];
                }
            });


        // -----------------------------------------------------
        // ENTREPRISES
        // -----------------------------------------------------

        this.productService
            .getCompanies()
            .subscribe({

                next: (data: any[]) => {

                    console.log(
                        'Entreprises reçues :',
                        data
                    );

                    this.companies =
                        Array.isArray(data)
                            ? data
                            : [];
                },

                error: (error: any) => {

                    console.error(
                        'Erreur chargement entreprises :',
                        error
                    );

                    this.companies = [];
                }
            });


        // -----------------------------------------------------
        // DOMAINES THÉRAPEUTIQUES
        // -----------------------------------------------------

        this.productService
            .getTherapeuticAreas()
            .subscribe({

                next: (data: any[]) => {

                    console.log(
                        'Domaines thérapeutiques reçus :',
                        data
                    );

                    this.therapeuticAreas =
                        Array.isArray(data)
                            ? data
                            : [];
                },

                error: (error: any) => {

                    console.error(
                        'Erreur chargement domaines thérapeutiques :',
                        error
                    );

                    this.therapeuticAreas = [];
                }
            });
    }


    // =========================================================
    // CHARGEMENT DES PRODUITS
    // =========================================================

    loadProducts(): void {

        this.loading = true;

        this.error = '';


        const keyword =
            this.searchTerm.trim();


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

                    console.log(
                        'Produits reçus :',
                        response
                    );


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


    // =========================================================
    // RECHERCHE AVEC ENTER
    // =========================================================

    onSearchKeydown(event: KeyboardEvent): void {

        if (event.key === 'Enter') {

            event.preventDefault();

            this.submitSearch();
        }
    }


    // =========================================================
    // CHANGEMENT DE FILTRE
    // =========================================================

    onFilterChange(): void {

        this.currentPage = 0;

        this.loadProducts();
    }


    // =========================================================
    // RESET
    // =========================================================

    resetFilters(): void {

        this.searchTerm = '';

        this.selectedCategory = null;

        this.selectedCompany = null;

        this.selectedTherapeuticArea = null;

        this.currentPage = 0;

        this.loadProducts();
    }


    // =========================================================
    // PAGE PRÉCÉDENTE
    // =========================================================

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


    // =========================================================
    // PAGE SUIVANTE
    // =========================================================

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


    // =========================================================
    // ALLER À UNE PAGE
    // =========================================================

    goToPage(page: number): void {

        if (
            page >= 0 &&
            page < this.totalPages
        ) {

            this.currentPage = page;

            this.loadProducts();

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }


    // =========================================================
    // PAGES À AFFICHER
    // =========================================================

    get pages(): number[] {

        const pages: number[] = [];

        const maxPagesToShow = 5;

        if (this.totalPages <= maxPagesToShow) {

            for (
                let i = 0;
                i < this.totalPages;
                i++
            ) {

                pages.push(i);
            }

            return pages;
        }


        let start =
            Math.max(
                0,
                this.currentPage - 2
            );


        let end =
            Math.min(
                this.totalPages - 1,
                start + maxPagesToShow - 1
            );


        if (
            end - start <
            maxPagesToShow - 1
        ) {

            start =
                Math.max(
                    0,
                    end - maxPagesToShow + 1
                );
        }


        for (
            let i = start;
            i <= end;
            i++
        ) {

            pages.push(i);
        }


        return pages;
    }


    // =========================================================
    // CHARGEMENT PANIER
    // =========================================================

    loadCart(): void {

        this.cartService
            .getCart()
            .subscribe({

                next: (cart: any) => {

                    if (
                        cart &&
                        Array.isArray(cart.items)
                    ) {

                        this.cartCount =
                            cart.items.reduce(
                                (
                                    total: number,
                                    item: any
                                ) =>
                                    total +
                                    (
                                        item.quantity ?? 0
                                    ),
                                0
                            );

                        return;
                    }


                    this.cartCount = 0;
                },

                error: (error: any) => {

                    console.error(
                        'Erreur chargement panier :',
                        error
                    );

                    this.cartCount = 0;
                }
            });
    }


    // =========================================================
    // AJOUT AU PANIER
    // =========================================================

    addToCart(product: Product): void {

        if (!product.id) {

            return;
        }


        if (
            product.stock === undefined ||
            product.stock <= 0
        ) {

            return;
        }


        this.cartService
            .addToCart(
                product.id,
                1
            )
            .subscribe({

                next: () => {

                    this.loadCart();
                },

                error: (error: any) => {

                    console.error(
                        'Erreur ajout panier :',
                        error
                    );
                }
            });
    }


    // =========================================================
    // IMAGE PRINCIPALE
    // =========================================================

    getProductImage(
        product: Product
    ): string {

        if (
            product.images &&
            product.images.length > 0
        ) {

            const mainImage =
                product.images.find(
                    (image: any) =>
                        image.main === true
                );


            if (mainImage?.imageUrl) {

                return mainImage.imageUrl;
            }


            if (
                product.images[0]?.imageUrl
            ) {

                return product.images[0].imageUrl;
            }
        }


        return '/images/products/default-product.jpg';
    }


    // =========================================================
    // ERREUR IMAGE
    // =========================================================

    onImageError(
        event: Event
    ): void {

        const image =
            event.target as HTMLImageElement;


        if (
            image.src.includes(
                'default-product.jpg'
            )
        ) {

            return;
        }


        image.src =
            '/images/products/default-product.jpg';
    }


    // =========================================================
    // PRIX
    // =========================================================

    formatPrice(
        price: number | null | undefined
    ): string {

        if (
            price === null ||
            price === undefined
        ) {

            return '0 FCFA';
        }


        return new Intl.NumberFormat(
            'fr-FR'
        ).format(price) + ' FCFA';
    }


    // =========================================================
    // STOCK
    // =========================================================

    isInStock(
        product: Product
    ): boolean {

        return (
            product.stock !== undefined &&
            product.stock > 0
        );
    }


    // =========================================================
    // NOMBRE DE PRODUITS AFFICHÉS
    // =========================================================

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

        return Math.min(
            (
                this.currentPage + 1
            ) * this.pageSize,

            this.totalElements
        );
    }
}
