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

import {
    parsePhoneNumberFromString,
    PhoneNumber
} from 'libphonenumber-js';

import {
    PHONE_COUNTRIES,
    PhoneCountry
} from '../../../shared/utils/phone-countries';


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

    /**
     * Numéro affiché dans le formulaire.
     *
     * Exemple :
     * 699123456
     */
    phone = '';

    /**
     * Liste des pays.
     */
    countries = PHONE_COUNTRIES;

    /**
     * Cameroun par défaut.
     */
    selectedCountry: PhoneCountry = PHONE_COUNTRIES[0];

    /**
     * Erreur spécifique au téléphone.
     */
    phoneError = '';


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

                    /*
                     * Si le backend retourne par exemple :
                     *
                     * +237699123456
                     *
                     * on essaie de détecter
                     * automatiquement le pays.
                     */
                    this.detectPhoneCountry();

                },

                error: (error) => {

                    console.error(
                        'Erreur récupération profil checkout :',
                        error
                    );

                    this.phone = '';

                    this.phoneError =
                        'Impossible de récupérer votre numéro de téléphone.';

                }

            });

    }


    // ==========================================
    // DETECTION DU PAYS
    // ==========================================

    detectPhoneCountry(): void {

        if (!this.phone.trim()) {

            return;

        }

        try {

            /*
             * On essaie de lire le numéro
             * directement depuis son format international.
             *
             * Exemple :
             *
             * +237699123456
             *
             * => pays CM
             */
            const phoneNumber =
                parsePhoneNumberFromString(
                    this.phone.trim()
                );

            if (!phoneNumber) {

                return;

            }

            const countryCode =
                phoneNumber.country;

            if (!countryCode) {

                return;

            }

            const country =
                this.countries.find(
                    c => c.code === countryCode
                );

            if (country) {

                this.selectedCountry =
                    country;

                /*
                 * On affiche uniquement la partie
                 * nationale dans le champ.
                 *
                 * +237699123456
                 *
                 * devient :
                 *
                 * 699123456
                 */
                this.phone =
                    phoneNumber.nationalNumber;

            }

        } catch (error) {

            console.warn(
                'Impossible de détecter le pays du numéro :',
                error
            );

        }

    }


    // ==========================================
    // CHANGEMENT DE PAYS
    // ==========================================

    onCountryChange(event: Event): void {

        const select =
            event.target as HTMLSelectElement;

        const country =
            this.countries.find(
                c => c.code === select.value
            );

        if (!country) {

            return;

        }

        this.selectedCountry =
            country;

        this.phoneError = '';

        /*
         * Si un numéro existe déjà,
         * on le revalide avec le nouveau pays.
         */
        if (this.phone.trim()) {

            this.validatePhone();

        }

    }


    // ==========================================
    // VALIDATION TELEPHONE
    // ==========================================

    validatePhone(): PhoneNumber | null {

        this.phoneError = '';

        const value =
            this.phone.trim();

        if (!value) {

            this.phoneError =
                'Le numéro de téléphone est obligatoire.';

            return null;

        }

        /*
         * Analyse du numéro avec le pays sélectionné.
         *
         * Exemple :
         *
         * pays = CM
         * téléphone = 699123456
         *
         * => +237699123456
         */
        const phoneNumber =
            parsePhoneNumberFromString(
                value,
                this.selectedCountry.code as any
            );

        if (!phoneNumber) {

            this.phoneError =
                `Le numéro saisi n'est pas reconnu pour ${this.selectedCountry.name}.`;

            return null;

        }

        /*
         * Vérification des règles
         * téléphoniques du pays.
         */
        if (!phoneNumber.isValid()) {

            this.phoneError =
                `Le numéro de téléphone n'est pas valide pour ${this.selectedCountry.name}.`;

            return null;

        }

        return phoneNumber;

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


        // ==========================================
        // VERIFICATION TELEPHONE
        // ==========================================

        const phoneNumber =
            this.validatePhone();

        if (!phoneNumber) {

            return;

        }


        // ==========================================
        // VERIFICATION ADRESSE
        // ==========================================

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
        // NUMERO INTERNATIONAL
        // ==========================================

        const internationalPhone =
            phoneNumber.number;

        console.log(
            'Téléphone checkout :',
            internationalPhone
        );


        /*
         * IMPORTANT :
         *
         * Pour l'instant, on ne met pas le téléphone
         * dans CreateOrderRequest parce que ton modèle
         * actuel ne semble pas le prévoir.
         *
         * Le backend peut continuer à récupérer
         * le téléphone depuis l'utilisateur connecté.
         */
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
    isBundle(item: any): boolean {

        return item.bundleId != null;

    }


    getItemName(item: any): string {

        if (this.isBundle(item)) {

            return item.bundleName
                ?? 'Pack';

        }

        return item.productName
            ?? 'Produit';

    }


    getItemType(item: any): string {

        return this.isBundle(item)
            ? 'Pack'
            : 'Produit';

    }

}