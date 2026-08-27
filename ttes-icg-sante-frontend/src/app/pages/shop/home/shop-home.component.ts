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


@Component({
    selector: 'app-shop-home',

    standalone: true,

    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ProductCardComponent
    ],

    templateUrl: './shop-home.component.html'
})
export class ShopHomeComponent implements OnInit {


    // =====================================================
    // SERVICES
    // =====================================================

    private productService =
        inject(ProductService);

    private cartService =
        inject(CartService);

    private authService =
        inject(AuthService);


    // =====================================================
    // PANIER
    // =====================================================

    cart: CartResponse | null = null;


    // =====================================================
    // PRODUITS
    // =====================================================

    products: Product[] = [];

    filteredProducts: Product[] = [];


    // =====================================================
    // RECHERCHE
    // =====================================================

    searchTerm = '';


    // =====================================================
    // FILTRES
    // =====================================================

    selectedCategory = '';

    selectedCompany = '';

    selectedTherapeuticArea = '';


    // =====================================================
    // LISTES FILTRES
    // =====================================================

    categories: string[] = [];

    companies: string[] = [];

    therapeuticAreas: string[] = [];


    // =====================================================
    // ETAT
    // =====================================================

    loading = true;

    error = '';


    // =====================================================
    // MENU MOBILE
    // =====================================================

    mobileMenuOpen = false;


    // =====================================================
    // INITIALISATION
    // =====================================================

    ngOnInit(): void {

        this.loadProducts();

        if (this.isLoggedIn()) {

            this.loadCart();

        }

    }


    // =====================================================
    // MENU MOBILE
    // =====================================================

    toggleMobileMenu(): void {

        this.mobileMenuOpen =
            !this.mobileMenuOpen;

    }


    closeMobileMenu(): void {

        this.mobileMenuOpen = false;

    }


    // =====================================================
    // AUTHENTIFICATION
    // =====================================================

    isLoggedIn(): boolean {

        return this.authService.isLoggedIn();

    }


    isAdmin(): boolean {

        return this.authService.hasRole(
            'ROLE_ADMIN'
        );

    }


    // =====================================================
    // PANIER
    // =====================================================

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

                    console.log(
                        '🛒 Panier chargé :',
                        cart
                    );

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


    // =====================================================
    // PRODUITS
    // =====================================================

    loadProducts(): void {

        this.loading = true;

        this.productService
            .getProducts()
            .subscribe({

                next: (products) => {

                    this.products =
                        products.filter(
                            product =>
                                product.stock > 0
                        );

                    this.filteredProducts =
                        this.products;

                    this.buildFilters();

                    this.loading = false;

                },

                error: (error) => {

                    console.error(
                        'Erreur lors du chargement des produits',
                        error
                    );

                    this.error =
                        'Impossible de charger les produits.';

                    this.loading = false;

                }

            });

    }


    // =====================================================
    // CONSTRUCTION DES FILTRES
    // =====================================================

    buildFilters(): void {

        const categories =
            this.products.flatMap(
                product =>
                    product.categories ?? []
            );

        const companies =
            this.products
                .map(
                    product =>
                        product.companyName
                )
                .filter(
                    value =>
                        !!value
                );

        const therapeuticAreas =
            this.products.flatMap(
                product =>
                    product.therapeuticAreas ?? []
            );


        this.categories =
            [...new Set(categories)]
                .sort();

        //this.companies =
        //    [...new Set(companies)]
        //        .sort();

        console.log('compqnie:',companies);

        this.therapeuticAreas =
            [...new Set(therapeuticAreas)]
                .sort();

    }


    // =====================================================
    // RECHERCHE + FILTRES
    // =====================================================

    search(): void {

        const term =
            this.searchTerm
                .trim()
                .toLowerCase();


        this.filteredProducts =
            this.products.filter(product => {


                // -----------------------------------------
                // RECHERCHE TEXTUELLE
                // -----------------------------------------

                const matchesSearch =
                    !term ||

                    product.name
                        ?.toLowerCase()
                        .includes(term)

                    ||

                    product.brand
                        ?.toLowerCase()
                        .includes(term)

                    ||

                    product.description
                        ?.toLowerCase()
                        .includes(term)

                    ||

                    product.categories?.some(
                        category =>
                            category
                                .toLowerCase()
                                .includes(term)
                    )

                    ||

                    product.companyName
                        ?.toLowerCase()
                        .includes(term)

                    ||

                    product.therapeuticAreas?.some(
                        area =>
                            area
                                .toLowerCase()
                                .includes(term)
                    );


                // -----------------------------------------
                // CATEGORIE
                // -----------------------------------------

                const matchesCategory =
                    !this.selectedCategory ||

                    product.categories?.includes(
                        this.selectedCategory
                    );


                // -----------------------------------------
                // ENTREPRISE
                // -----------------------------------------

                const matchesCompany =
                    !this.selectedCompany ||

                    product.companyName ===
                    this.selectedCompany;


                // -----------------------------------------
                // DOMAINE THERAPEUTIQUE
                // -----------------------------------------

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

            });

    }


    // =====================================================
    // RESET FILTRES
    // =====================================================

    resetFilters(): void {

        this.searchTerm = '';

        this.selectedCategory = '';

        this.selectedCompany = '';

        this.selectedTherapeuticArea = '';

        this.filteredProducts =
            this.products;

    }


    // =====================================================
    // PANIER PRODUIT
    // =====================================================

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


    // =====================================================
    // IMAGE
    // =====================================================

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
                image =>
                    image.main
            );


        return (
            mainImage?.imageUrl
            ||
            product.images[0].imageUrl
        );

    }


    // =====================================================
    // PRIX
    // =====================================================

    formatPrice(
        price: number | undefined
    ): string {

        return new Intl.NumberFormat(
            'fr-FR'
        ).format(
            price ?? 0
        ) + ' FCFA';

    }

}