import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
    Router,
    RouterModule
} from '@angular/router';

import {
    CartService
} from '../../../core/services/cart.service';

import {
    Cart,
    CartItem
} from '../../../core/interfaces/cart.interface';


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


    // ==========================================
    // ÉTAT
    // ==========================================

    cart: Cart | null = null;

    loading = true;

    error = '';

    /**
     * Message d'erreur lié à une action
     * effectuée sur le panier.
     *
     * Exemple :
     * "Stock insuffisant pour le pack pack1"
     */
    actionError = '';

    updatingItemId: number | null = null;


    // ==========================================
    // INITIALISATION
    // ==========================================

    ngOnInit(): void {

        this.loadCart();

    }


    // ==========================================
    // CHARGER LE PANIER
    // ==========================================

    loadCart(): void {

        this.loading = true;

        this.error = '';

        /*
         * IMPORTANT :
         *
         * On ne fait PAS :
         *
         * this.actionError = '';
         *
         * ici.
         *
         * Sinon, lorsqu'une modification de quantité
         * échoue, le message "Stock insuffisant..."
         * serait immédiatement supprimé.
         */

        this.cartService
            .getCart()
            .subscribe({

                next: (cart) => {

                    cart.items.sort(
                        (a, b) => a.id - b.id
                    );

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
                        ?? error?.error?.error
                        ?? 'Impossible de charger le panier.';

                    this.loading = false;

                }

            });

    }


    // ==========================================
    // TRACK BY
    // ==========================================

    trackByItemId(
        index: number,
        item: CartItem
    ): number {

        return item.id;

    }


    // ==========================================
    // DÉTECTER PACK
    // ==========================================

    isBundle(item: CartItem): boolean {

        return item.bundleId != null;

    }


    // ==========================================
    // NOM ARTICLE
    // ==========================================

    getItemName(item: CartItem): string {

        if (this.isBundle(item)) {

            return item.bundleName
                ?? 'Pack';

        }

        return item.productName
            ?? 'Produit';

    }


    // ==========================================
    // TYPE ARTICLE
    // ==========================================

    getItemType(item: CartItem): string {

        return this.isBundle(item)
            ? 'Pack'
            : 'Produit';

    }


    // ==========================================
    // QUANTITÉ
    // ==========================================

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


    // ==========================================
    // AUGMENTER
    // ==========================================

    increase(
        itemId: number,
        quantity: number
    ): void {

        this.updateQuantity(
            itemId,
            quantity + 1
        );

    }


    // ==========================================
    // DIMINUER
    // ==========================================

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


    // ==========================================
    // MODIFIER QUANTITÉ
    // ==========================================

    updateQuantity(
        itemId: number,
        quantity: number
    ): void {

        if (
            !Number.isInteger(quantity)
            || quantity < 1
        ) {
            return;
        }

        /*
         * On supprime uniquement l'ancien message
         * au début d'une nouvelle tentative.
         */
        this.actionError = '';

        this.updatingItemId = itemId;

        this.cartService
            .updateQuantity(
                itemId,
                quantity
            )
            .subscribe({

                // ==================================
                // SUCCÈS
                // ==================================

                next: (cart) => {

                    cart.items.sort(
                        (a, b) => a.id - b.id
                    );

                    this.cart = cart;

                    this.updatingItemId = null;

                },

                // ==================================
                // ERREUR
                // ==================================

                error: (error) => {

                    console.error(
                        'Erreur modification quantité',
                        error
                    );

                    this.updatingItemId = null;

                    /*
                     * Le backend peut renvoyer :
                     *
                     * {
                     *     "message":
                     *     "Stock insuffisant pour le pack pack1"
                     * }
                     *
                     * ou :
                     *
                     * {
                     *     "error":
                     *     "Stock insuffisant pour le pack pack1"
                     * }
                     */

                    this.actionError =
                        error?.error?.message
                        ?? error?.error?.error
                        ?? 'Stock insuffisant pour cet article.';


                    /*
                     * On recharge le panier pour conserver
                     * la quantité réellement enregistrée.
                     *
                     * IMPORTANT :
                     * loadCart() ne supprime plus actionError.
                     */
                    this.loadCart();

                }

            });

    }


    // ==========================================
    // SUPPRIMER
    // ==========================================

    removeItem(itemId: number): void {

        this.actionError = '';

        this.cartService
            .removeItem(itemId)
            .subscribe({

                next: (cart) => {

                    cart.items.sort(
                        (a, b) => a.id - b.id
                    );

                    this.cart = cart;

                },

                error: (error) => {

                    console.error(
                        'Erreur suppression article',
                        error
                    );

                    this.actionError =
                        error?.error?.message
                        ?? error?.error?.error
                        ?? 'Impossible de supprimer cet article.';

                }

            });

    }


    // ==========================================
    // FERMER MESSAGE
    // ==========================================

    closeActionError(): void {

        this.actionError = '';

    }


    // ==========================================
    // PANIER VIDE
    // ==========================================

    get isEmpty(): boolean {

        return !this.cart
            || this.cart.items.length === 0;

    }


    // ==========================================
    // FORMAT PRIX
    // ==========================================

    formatPrice(price: number): string {

        return new Intl.NumberFormat(
            'fr-FR'
        ).format(price) + ' FCFA';

    }


    // ==========================================
    // CHECKOUT
    // ==========================================

    checkout(): void {

        if (
            !this.cart
            || this.cart.items.length === 0
        ) {
            return;
        }

        this.router.navigate([
            '/checkout'
        ]);

    }

}