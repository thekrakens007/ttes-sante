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
import {ProductCardComponent} from "../../../shared/components/client/product-card/product-card.component";
import {CartService} from "../../../core/services/cart.service";
import {CartResponse} from "../../../core/interfaces/cart.interface";
import {AuthService} from "../../../core/services/auth.service";

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

    private productService = inject(ProductService);
    private cartService = inject(CartService);
    private authService = inject(AuthService);
    cart: CartResponse | null = null;
    products: Product[] = [];

    filteredProducts: Product[] = [];

    searchTerm = '';

    loading = true;

    error = '';

    ngOnInit(): void {
        this.loadProducts();

        // Charger le panier uniquement si connecté
        if (this.isLoggedIn()) {
            this.loadCart();
        }
    }

    isLoggedIn(): boolean {
        return this.authService.isLoggedIn();
    }
    loadCart(): void {

        this.cartService.getCart()
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


    loadProducts(): void {

        this.loading = true;

        this.productService.getProducts()
            .subscribe({

                next: (products) => {

                    this.products = products.filter(
                        product => product.stock > 0
                    );

                    this.filteredProducts = this.products;

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
    isProductInCart(productId: number): boolean {

        if (!this.cart?.items) {
            return false;
        }

        return this.cart.items.some(
            item => item.productId === productId
        );
    }

    getProductQuantity(productId: number): number {

        if (!this.cart?.items) {
            return 0;
        }

        const item = this.cart.items.find(
            item => item.productId === productId
        );

        return item?.quantity ?? 0;
    }


    search(): void {

        const term =
            this.searchTerm.trim().toLowerCase();

        if (!term) {

            this.filteredProducts =
                this.products;

            return;
        }

        this.filteredProducts =
            this.products.filter(product =>

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

                product.categories?.some(category =>
                    category.toLowerCase().includes(term)
                )

            );
    }

    getMainImage(product: Product): string {

        if (!product.images || product.images.length === 0) {

            return '/images/products/default-product.png';
        }

        const mainImage =
            product.images.find(
                image => image.main
            );

        return mainImage?.imageUrl
            || product.images[0].imageUrl;
    }

    formatPrice(price: number): string {

        return new Intl.NumberFormat(
            'fr-FR'
        ).format(price) + ' FCFA';
    }

}