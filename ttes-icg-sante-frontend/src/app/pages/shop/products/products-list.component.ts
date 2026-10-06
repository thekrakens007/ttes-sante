import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';

import {
    Product,
    ProductPage
} from '../../../core/models/product.model';

import { Cart } from '../../../core/interfaces/cart.interface';


interface PaginationPage {
    type: 'page' | 'ellipsis';
    value?: number;
}


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

    /* ===================================================== */
    /* SERVICES */
    /* ===================================================== */

    private readonly productService =
        inject(ProductService);

    private readonly cartService =
        inject(CartService);

    private readonly authService =
        inject(AuthService);


    /* ===================================================== */
    /* PRODUITS */
    /* ===================================================== */

    products: Product[] = [];

    filteredProducts: Product[] = [];

    loading = false;

    error = '';


    /* ===================================================== */
    /* RECHERCHE */
    /* ===================================================== */

    searchTerm = '';


    /* ===================================================== */
    /* FILTRES */
    /* ===================================================== */

    selectedCategory = '';

    selectedCompany = '';

    selectedTherapeuticArea = '';


    /*
     * Ces tableaux correspondent aux valeurs
     * utilisées dans ton HTML.
     */
    categories: string[] = [];

    companies: string[] = [];

    therapeuticAreas: string[] = [];


    /* ===================================================== */
    /* PAGINATION */
    /* ===================================================== */

    currentPage = 0;

    pageSize = 12;

    totalPages = 0;

    totalElements = 0;


    /* ===================================================== */
    /* MENU MOBILE */
    /* ===================================================== */

    mobileMenuOpen = false;


    /* ===================================================== */
    /* PANIER */
    /* ===================================================== */

    /**
     * Panier actuellement chargé.
     */
    cart: Cart | null = null;


    /**
     * Nombre total d'unités dans le panier.
     *
     * Exemple :
     *
     * Produit A = 2
     * Produit B = 3
     *
     * cartCount = 5
     */
    cartCount = 0;


    /**
     * ID du produit en cours d'ajout.
     *
     * Permet d'afficher "Ajout..."
     * uniquement sur le produit concerné.
     */
    addingToCartId: number | null = null;


    /**
     * Message de succès.
     */
    cartMessage = '';


    /**
     * Message d'erreur.
     */
    cartError = '';


    /* ===================================================== */
    /* INIT */
    /* ===================================================== */

    ngOnInit(): void {

        this.loadProducts();

        this.loadCart();
    }


    /* ===================================================== */
    /* CHARGEMENT DES PRODUITS */
    /* ===================================================== */

    loadProducts(): void {

        this.loading = true;

        this.error = '';


        const keyword =
            this.searchTerm.trim();


        /*
         * Recherche uniquement lorsque
         * l'utilisateur a soumis le formulaire.
         */
        const request$ = keyword
            ? this.productService.searchProductsPaginated(
                keyword,
                this.currentPage,
                this.pageSize
            )
            : this.productService.getProductsPaginated(
                this.currentPage,
                this.pageSize
            );


        request$.subscribe({

            next: (response: ProductPage) => {

                this.products =
                    response.content ?? [];


                this.totalElements =
                    response.totalElements ?? 0;


                this.totalPages =
                    response.totalPages ?? 0;


                /*
                 * Construire les valeurs disponibles
                 * pour les filtres.
                 */
                this.buildFilterValues();


                /*
                 * Appliquer les filtres locaux
                 * sur la page actuellement chargée.
                 */
                this.applyLocalFilters();


                this.loading = false;
            },


            error: (err: unknown) => {

                console.error(
                    'Erreur chargement produits :',
                    err
                );


                this.error =
                    'Impossible de charger les produits.';


                this.products = [];

                this.filteredProducts = [];


                this.loading = false;
            }
        });
    }


    /* ===================================================== */
    /* CONSTRUIRE LES VALEURS DES FILTRES */
    /* ===================================================== */

    buildFilterValues(): void {

        /*
         * Catégories
         */
        const categoryValues =
            this.products.flatMap(
                product =>
                    product.categories ?? []
            );


        this.categories =
            Array.from(
                new Set(categoryValues)
            ).sort();


        /*
         * Entreprises
         */
        const companyValues =
            this.products
                .map(
                    product =>
                        product.companyName
                )
                .filter(
                    (
                        company
                    ): company is string =>
                        !!company
                );


        this.companies =
            Array.from(
                new Set(companyValues)
            ).sort();


        /*
         * Domaines thérapeutiques
         */
        const therapeuticValues =
            this.products.flatMap(
                product =>
                    product.therapeuticAreas ?? []
            );


        this.therapeuticAreas =
            Array.from(
                new Set(therapeuticValues)
            ).sort();
    }


    /* ===================================================== */
    /* RECHERCHE */
    /* ===================================================== */

    submitSearch(): void {

        /*
         * Toujours revenir à la première page
         * lors d'une nouvelle recherche.
         */
        this.currentPage = 0;

        this.loadProducts();
    }


    /* ===================================================== */
    /* FILTRES */
    /* ===================================================== */

    onFilterChange(): void {

        /*
         * Les filtres sont appliqués sur les
         * produits de la page actuellement chargée.
         */
        this.applyLocalFilters();
    }


    applyLocalFilters(): void {

        let result =
            [...this.products];


        /* --------------------------------------------- */
        /* Catégorie */
        /* --------------------------------------------- */

        if (this.selectedCategory) {

            result =
                result.filter(
                    product =>
                        product.categories?.includes(
                            this.selectedCategory
                        )
                );
        }


        /* --------------------------------------------- */
        /* Entreprise */
        /* --------------------------------------------- */

        if (this.selectedCompany) {

            result =
                result.filter(
                    product =>
                        product.companyName ===
                        this.selectedCompany
                );
        }


        /* --------------------------------------------- */
        /* Domaine thérapeutique */
        /* --------------------------------------------- */

        if (this.selectedTherapeuticArea) {

            result =
                result.filter(
                    product =>
                        product.therapeuticAreas?.includes(
                            this.selectedTherapeuticArea
                        )
                );
        }


        this.filteredProducts =
            result;
    }


    /* ===================================================== */
    /* RESET FILTRES */
    /* ===================================================== */

    resetFilters(): void {

        this.searchTerm = '';

        this.selectedCategory = '';

        this.selectedCompany = '';

        this.selectedTherapeuticArea = '';

        this.currentPage = 0;

        this.loadProducts();
    }


    /* ===================================================== */
    /* PAGINATION */
    /* ===================================================== */

    previousPage(): void {

        if (this.currentPage <= 0) {
            return;
        }


        this.goToPage(
            this.currentPage - 1
        );
    }


    nextPage(): void {

        if (
            this.currentPage >=
            this.totalPages - 1
        ) {
            return;
        }


        this.goToPage(
            this.currentPage + 1
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


        this.currentPage =
            page;


        this.loadProducts();


        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }


    /* ===================================================== */
    /* PAGINATION : PAGES À AFFICHER */
    /* ===================================================== */

    getPaginationPages(): PaginationPage[] {

        const pages: PaginationPage[] = [];


        /*
         * Aucun résultat.
         */
        if (this.totalPages <= 0) {
            return pages;
        }


        /*
         * 7 pages ou moins :
         * afficher toutes les pages.
         */
        if (this.totalPages <= 7) {

            for (
                let i = 0;
                i < this.totalPages;
                i++
            ) {

                pages.push({
                    type: 'page',
                    value: i
                });
            }


            return pages;
        }


        /*
         * Première page.
         */
        pages.push({
            type: 'page',
            value: 0
        });


        /*
         * Ellipsis après la première page.
         */
        if (this.currentPage > 3) {

            pages.push({
                type: 'ellipsis'
            });
        }


        /*
         * Pages autour de la page courante.
         */
        const start =
            Math.max(
                1,
                this.currentPage - 1
            );


        const end =
            Math.min(
                this.totalPages - 2,
                this.currentPage + 1
            );


        for (
            let i = start;
            i <= end;
            i++
        ) {

            pages.push({
                type: 'page',
                value: i
            });
        }


        /*
         * Ellipsis avant la dernière page.
         */
        if (
            this.currentPage <
            this.totalPages - 4
        ) {

            pages.push({
                type: 'ellipsis'
            });
        }


        /*
         * Dernière page.
         */
        pages.push({
            type: 'page',
            value: this.totalPages - 1
        });


        return pages;
    }


    /* ===================================================== */
    /* PANIER : CHARGER LE PANIER */
    /* ===================================================== */

    loadCart(): void {

        /*
         * Un utilisateur non connecté
         * n'a pas besoin de charger le panier.
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
                    err: unknown
                ) => {

                    console.error(
                        'Erreur chargement panier :',
                        err
                    );


                    this.cart = null;

                    this.cartCount = 0;
                }
            });
    }


    /* ===================================================== */
    /* PANIER : COMPTEUR GLOBAL */
    /* ===================================================== */

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


    /* ===================================================== */
    /* PANIER : QUANTITÉ D'UN PRODUIT */
    /* ===================================================== */

    getProductCartQuantity(
        productId: number
    ): number {

        if (
            !this.cart?.items
        ) {
            return 0;
        }


        /*
         * On recherche le produit dans
         * les articles du panier.
         *
         * La vérification est volontairement
         * compatible avec plusieurs structures
         * possibles de CartItem.
         */
        const item =
            this.cart.items.find(
                (cartItem: any) => {

                    return (
                        cartItem.productId ===
                            productId
                        ||
                        cartItem.product?.id ===
                            productId
                    );
                }
            );


        return item?.quantity ?? 0;
    }


    /* ===================================================== */
    /* PANIER : AJOUTER UN PRODUIT */
    /* ===================================================== */

    addToCart(
        product: Product
    ): void {

        /* --------------------------------------------- */
        /* Vérifier connexion */
        /* --------------------------------------------- */

        if (
            !this.authService.isLoggedIn()
        ) {

            this.cartError =
                'Connectez-vous pour ajouter un produit au panier.';


            this.cartMessage = '';


            setTimeout(() => {

                this.cartError = '';

            }, 4000);


            return;
        }


        /* --------------------------------------------- */
        /* Vérifier le stock */
        /* --------------------------------------------- */

        if (
            product.stock <= 0
        ) {

            this.cartError =
                'Ce produit est actuellement en rupture de stock.';


            this.cartMessage = '';


            setTimeout(() => {

                this.cartError = '';

            }, 4000);


            return;
        }


        /* --------------------------------------------- */
        /* Empêcher les doubles clics */
        /* --------------------------------------------- */

        if (
            this.addingToCartId !== null
        ) {
            return;
        }


        this.addingToCartId =
            product.id;


        this.cartMessage = '';

        this.cartError = '';


        /* --------------------------------------------- */
        /* Ajouter le produit */
        /* --------------------------------------------- */

        this.cartService
            .addItem(
                product.id,
                1
            )
            .subscribe({

                /*
                 * Le backend renvoie
                 * le panier mis à jour.
                 */
                next: (
                    cart: Cart
                ) => {

                    this.cart =
                        cart;


                    this.updateCartCount();


                    this.cartMessage =
                        `${product.name} a été ajouté au panier.`;


                    this.addingToCartId =
                        null;


                    setTimeout(() => {

                        this.cartMessage = '';

                    }, 3000);
                },


                error: (
                    err: unknown
                ) => {

                    console.error(
                        'Erreur ajout au panier :',
                        err
                    );


                    this.cartError =
                        'Impossible d’ajouter ce produit au panier.';


                    this.addingToCartId =
                        null;


                    setTimeout(() => {

                        this.cartError = '';

                    }, 4000);
                }
            });
    }


    /* ===================================================== */
    /* MENU MOBILE */
    /* ===================================================== */

    toggleMobileMenu(): void {

        this.mobileMenuOpen =
            !this.mobileMenuOpen;
    }


    closeMobileMenu(): void {

        this.mobileMenuOpen =
            false;
    }
}
