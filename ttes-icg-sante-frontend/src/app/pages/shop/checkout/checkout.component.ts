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

    // ==========================================
    // SERVICES
    // ==========================================

    private cartService = inject(CartService);

    private orderService = inject(OrderService);

    private router = inject(Router);

    private userService = inject(UserService);


    // ==========================================
    // DONNEES
    // ==========================================

    cart: Cart | null = null;

    order: Order | null = null;


    // ==========================================
    // ETAT
    // ==========================================

    loading = true;

    submitting = false;

    success = false;

    error = '';


    // ==========================================
    // FORMULAIRE
    // ==========================================

    deliveryAddress = '';

    customerNote = '';

    phone = '';


    // ==========================================
    // INITIALISATION
    // ==========================================

    ngOnInit(): void {

        this.loadProfile();

        this.loadCart();

    }


    // ==========================================
    // PROFIL
    // ==========================================

    loadProfile(): void {

        this.userService
            .getMyProfile()
            .subscribe({

                next: (profile) => {

                    console.log(
                        'Profil utilisateur checkout :',
                        profile
                    );

                    this.phone =
                        profile.phone ?? '';

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


    // ==========================================
    // PANIER
    // ==========================================

    loadCart(): void {

        this.loading = true;

        this.error = '';

        this.cartService
            .getCart()
            .subscribe({

                next: (cart) => {

                    this.cart = cart;

                    this.loading = false;


                    // Panier vide
                    if (
                        !cart.items ||
                        cart.items.length === 0
                    ) {

                        this.router.navigate([
                            '/cart'
                        ]);

                    }

                },

                error: (error) => {

                    console.error(
                        'Erreur chargement panier',
                        error
                    );

                    this.error =
                        error?.error?.message
                        ??
                        'Impossible de charger votre panier.';

                    this.loading = false;

                }

            });

    }


    // ==========================================
    // CONFIRMER LA COMMANDE
    // ==========================================

    confirmOrder(): void {

        // Vérification panier
        if (!this.cart) {

            return;

        }


        if (
            !this.cart.items ||
            this.cart.items.length === 0
        ) {

            alert(
                'Votre panier est vide.'
            );

            return;

        }


        // Vérification adresse
        if (
            !this.deliveryAddress.trim()
        ) {

            alert(
                'Veuillez saisir votre adresse de livraison.'
            );

            return;

        }


        // Empêcher double clic
        if (this.submitting) {

            return;

        }


        this.submitting = true;

        this.error = '';


        // ==========================================
        // REQUEST
        // ==========================================

        const request: CreateOrderRequest = {

            deliveryAddress:
                this.deliveryAddress.trim(),

            customerNote:
                this.customerNote.trim()
                || undefined

        };


        console.log(
            'Création commande :',
            request
        );


        // ==========================================
        // CREATION COMMANDE
        // ==========================================

        this.orderService
            .createOrder(request)
            .subscribe({

                next: (order) => {

                    console.log(
                        'Commande créée :',
                        order
                    );


                    this.order = order;

                    this.success = true;

                    this.submitting = false;


                    // ==================================
                    // WHATSAPP
                    // ==================================

                    if (order.whatsappLink) {

                        console.log(
                            'Redirection WhatsApp :',
                            order.whatsappLink
                        );


                        /*
                         * Le backend a généré le lien
                         * WhatsApp avec les informations
                         * complètes de la commande.
                         */

                        window.location.href =
                            order.whatsappLink;

                        return;

                    }


                    // ==================================
                    // PAS DE LIEN WHATSAPP
                    // ==================================

                    console.warn(
                        'Aucun lien WhatsApp reçu par le backend.'
                    );


                    this.router.navigate(
                        [
                            '/order-success',
                            order.id
                        ],
                        {
                            state: {
                                order: order
                            }
                        }
                    );

                },


                // =====================================
                // ERREUR
                // =====================================

                error: (error) => {

                    console.error(
                        'Erreur création commande',
                        error
                    );


                    this.submitting = false;


                    this.error =
                        error?.error?.message
                        ??
                        'Impossible de créer la commande.';


                    alert(
                        this.error
                    );

                }

            });

    }


    // ==========================================
    // FORMAT PRIX
    // ==========================================

    formatPrice(
        price: number | undefined
    ): string {

        return new Intl.NumberFormat(
                'fr-FR'
            ).format(price ?? 0)
            + ' FCFA';

    }


    // ==========================================
    // NAVIGATION
    // ==========================================

    goToShop(): void {

        this.router.navigate([
            '/shop'
        ]);

    }


    goToOrders(): void {

        this.router.navigate([
            '/orders'
        ]);

    }

}