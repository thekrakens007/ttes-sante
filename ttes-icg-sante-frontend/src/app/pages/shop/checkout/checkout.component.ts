import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';

import {
    CreateOrderRequest,
    Order
} from '../../../core/models/order.model';

import { Cart } from '../../../core/interfaces/cart.interface';

import { UserService } from '../../../core/services/user.service';


@Component({
    selector: 'app-checkout',
    standalone: true,

    imports: [
        CommonModule,
        FormsModule,
        RouterModule
    ],

    templateUrl: './checkout.component.html'
})
export class CheckoutComponent implements OnInit {

    private cartService = inject(CartService);

    private orderService = inject(OrderService);

    private router = inject(Router);

    private userService = inject(UserService);


    cart: Cart | null = null;

    loading = true;

    submitting = false;

    error = '';

    success = false;

    order: Order | null = null;


    deliveryAddress = '';

    customerNote = '';

    phone = '';


    ngOnInit(): void {

        this.loadProfile();

        this.loadCart();

    }


    /**
     * Récupérer le profil de l'utilisateur connecté
     */
    loadProfile(): void {

        this.userService.getMyProfile().subscribe({

            next: (profile) => {

                console.log(
                    'Profil utilisateur checkout :',
                    profile
                );

                this.phone = profile.phone ?? '';

            },

            error: (error) => {

                console.error(
                    'Erreur récupération profil checkout :',
                    error
                );

                this.phone = '';

            }

        });

    }


    /**
     * Charger le panier
     */
    loadCart(): void {

        this.loading = true;

        this.cartService
            .getCart()
            .subscribe({

                next: (cart) => {

                    this.cart = cart;

                    this.loading = false;

                    if (!cart.items.length) {

                        this.router.navigate(['/cart']);

                    }

                },

                error: (error) => {

                    console.error(
                        'Erreur chargement panier',
                        error
                    );

                    this.error =
                        'Impossible de charger votre panier.';

                    this.loading = false;

                }

            });

    }


    /**
     * Créer la commande
     */
    confirmOrder(): void {

        if (!this.cart) {
            return;
        }

        if (
            !this.cart.items ||
            this.cart.items.length === 0
        ) {

            alert('Votre panier est vide.');

            return;

        }

        if (!this.deliveryAddress.trim()) {

            alert(
                'Veuillez saisir votre adresse de livraison.'
            );

            return;

        }

        if (this.submitting) {
            return;
        }

        this.submitting = true;

        const request: CreateOrderRequest = {

            deliveryAddress:
                this.deliveryAddress.trim(),

            customerNote:
                this.customerNote.trim() || undefined

        };

        console.log(
            'Création commande :',
            request
        );

        this.orderService
            .createOrder(request)
            .subscribe({

                next: (order) => {

                    console.log(
                        'Commande créée :',
                        order
                    );

                    this.submitting = false;

                    this.router.navigate(
                        ['/order-success', order.id],
                        {
                            state: {
                                order: order
                            }
                        }
                    );

                },

                error: (error) => {

                    console.error(
                        'Erreur création commande',
                        error
                    );

                    this.submitting = false;

                    alert(
                        error?.error?.message
                        ??
                        'Impossible de créer la commande.'
                    );

                }

            });

    }


    formatPrice(
        price: number | undefined
    ): string {

        return new Intl.NumberFormat(
            'fr-FR'
        ).format(price ?? 0) + ' FCFA';

    }


    goToShop(): void {

        this.router.navigate(['/shop']);

    }


    goToOrders(): void {

        this.router.navigate(['/orders']);

    }

}