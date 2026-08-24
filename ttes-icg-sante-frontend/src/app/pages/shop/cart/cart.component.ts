import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import {Router, RouterModule} from '@angular/router';

import {
    CartService
} from '../../../core/services/cart.service';
import {Cart, CartItem} from "../../../core/interfaces/cart.interface";

@Component({
    selector: 'app-cart',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule
    ],
    templateUrl: './cart.component.html'
})
export class CartComponent implements OnInit {

    private cartService = inject(CartService);

    private router = inject(Router);

    cart: Cart | null = null;

    loading = true;

    error = '';

    updatingItemId: number | null = null;
    trackByItemId(
        index: number,
        item: CartItem
    ): number {
        console.log(index);
        console.log(item.id);
        return item.id;
    }


    ngOnInit(): void {

        this.loadCart();

    }


    /**
     * Charger le panier
     */
    loadCart(): void {

        this.loading = true;

        this.error = '';

        this.cartService
            .getCart()
            .subscribe({

                next: (cart) => {

                    cart.items.sort((a, b) => a.id - b.id);

                    this.cart = cart;

                    this.loading = false;

                },

                error: (error) => {

                    console.error(
                        'Erreur chargement panier',
                        error
                    );

                    this.error =
                        error?.error?.message
                        ?? 'Impossible de charger le panier.';

                    this.loading = false;

                }

            });

    }

    onQuantityInput(
        itemId: number,
        value: string
    ): void {

        const quantity = Number(value);

        if (!Number.isInteger(quantity)) {
            return;
        }

        if (quantity < 1) {
            return;
        }

        this.updateQuantity(
            itemId,
            quantity
        );

    }
    /**
     * Augmenter la quantité
     */
    increase(
        itemId: number,
        quantity: number
    ): void {

        this.updateQuantity(
            itemId,
            quantity + 1
        );

    }


    /**
     * Diminuer la quantité
     */
    decrease(
        itemId: number,
        quantity: number
    ): void {

        if (quantity <= 1) {
            return;
        }

        this.updateQuantity(
            itemId,
            quantity - 1
        );

    }


    /**
     * Modifier quantité
     */
    updateQuantity(
        itemId: number,
        quantity: number
    ): void {

        if (!Number.isInteger(quantity) || quantity < 1) {
            return;
        }

        this.updatingItemId = itemId;

        this.cartService
            .updateQuantity(
                itemId,
                quantity
            )
            .subscribe({

                next: (cart) => {

                    cart.items.sort((a, b) => a.id - b.id);

                    this.cart = cart;

                    this.updatingItemId = null;

                },

                error: (error) => {

                    console.error(
                        'Erreur modification quantité',
                        error
                    );

                    this.updatingItemId = null;

                    alert(
                        error?.error?.message
                        ?? 'Impossible de modifier la quantité.'
                    );

                    // Recharger pour récupérer la vraie valeur
                    this.loadCart();

                }

            });
    }



    /**
     * Supprimer un article
     */
    removeItem(itemId: number): void {

        this.cartService
            .removeItem(itemId)
            .subscribe({

                next: (cart) => {

                    this.cart = cart;

                },

                error: (error) => {

                    console.error(
                        'Erreur suppression article',
                        error
                    );

                    alert(
                        error?.error?.message
                        ?? 'Impossible de supprimer cet article.'
                    );

                }

            });

    }


    /**
     * Vérifier panier vide
     */
    get isEmpty(): boolean {

        return !this.cart ||
            this.cart.items.length === 0;

    }


    /**
     * Format prix
     */
    formatPrice(price: number): string {

        return new Intl.NumberFormat(
            'fr-FR'
        ).format(price) + ' FCFA';

    }

    checkout(): void {

        if (!this.cart || this.cart.items.length === 0) {

            return;

        }

        this.router.navigate(['/checkout']);

    }

}