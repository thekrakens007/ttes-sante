import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { Router } from '@angular/router';

import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';

@Component({
    selector: 'app-checkout',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule
    ],
    templateUrl: './checkout.component.html'
})
export class CheckoutComponent {

    private fb = inject(FormBuilder);
    private cartService = inject(CartService);
    private orderService = inject(OrderService);
    private router = inject(Router);

    cart: any = null;

    loading = false;
    errorMessage = '';

    checkoutForm = this.fb.group({
        deliveryAddress: [
            '',
            [Validators.required, Validators.minLength(5)]
        ],
        customerNote: ['']
    });

    ngOnInit(): void {
        this.loadCart();
    }

    loadCart(): void {

        this.cartService.getCart().subscribe({
            next: cart => {

                this.cart = cart;

                if (!cart || !cart.items || cart.items.length === 0) {
                    this.router.navigate(['/cart']);
                }

            },
            error: error => {

                console.error(error);

                this.errorMessage =
                    'Impossible de charger votre panier.';
            }
        });

    }

    getTotal(): number {

        if (!this.cart?.items) {
            return 0;
        }

        return this.cart.items.reduce(
            (total: number, item: any) =>
                total + (item.price * item.quantity),
            0
        );
    }

    submitOrder(): void {

        if (this.checkoutForm.invalid) {

            this.checkoutForm.markAllAsTouched();

            return;
        }

        this.loading = true;
        this.errorMessage = '';

        const request = {
            deliveryAddress:
                this.checkoutForm.value.deliveryAddress!,

            customerNote:
                this.checkoutForm.value.customerNote || ''
        };

        this.orderService.createOrder(request).subscribe({

            next: order => {

                this.loading = false;

                /*
                 * Si le backend retourne un lien WhatsApp,
                 * on peut directement proposer au client
                 * de poursuivre la commande sur WhatsApp.
                 */

                if (order.whatsappLink) {

                    window.location.href =
                        order.whatsappLink;

                    return;
                }

                this.router.navigate([
                    '/orders',
                    order.id
                ]);

            },

            error: error => {

                console.error(error);

                this.loading = false;

                this.errorMessage =
                    error?.error?.message ||
                    'Impossible de créer la commande.';
            }

        });

    }

    isInvalid(controlName: string): boolean {

        const control =
            this.checkoutForm.get(controlName);

        return !!(
            control &&
            control.invalid &&
            (control.dirty || control.touched)
        );
    }

}