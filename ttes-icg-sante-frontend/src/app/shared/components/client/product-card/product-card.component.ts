import {
    Component,
    Input,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { Product } from '../../../../core/models/product.model';
import { CartService } from '../../../../core/services/cart.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-product-card',
    standalone: true,
    imports: [
        CommonModule
    ],
    templateUrl: './product-card.component.html'
})
export class ProductCardComponent {

    @Input() product!: Product;

    private cartService = inject(CartService);
    private authService = inject(AuthService);
    private router = inject(Router);

    addingToCart = false;

    addedToCart = false;


    get mainImage(): string {

        if (!this.product?.images?.length) {

            return '/images/products/product-placeholder.png';

        }

        const main =
            this.product.images.find(
                image => image.main === true
            );

        return main?.imageUrl
            ?? this.product.images[0].imageUrl;
    }


    addToCart(): void {

        console.log('🔥 CLICK SUR AJOUTER AU PANIER');

        if (!this.product || this.product.stock <= 0) {
            return;
        }

        // Vérifier si le client est connecté
        if (!this.authService.isLoggedIn()) {

            alert(
                'Vous devez créer un compte ou vous connecter pour ajouter un produit au panier.'
            );

            this.router.navigate(['/signin']);

            return;
        }

        // Éviter les doubles clics
        if (this.addingToCart) {
            return;
        }

        this.addingToCart = true;

        this.cartService
            .addItem(this.product.id, 1)
            .subscribe({

                next: (cart) => {

                    console.log(
                        '✅ Produit ajouté au panier',
                        cart
                    );

                    this.addingToCart = false;

                    alert(
                        'Produit ajouté au panier !'
                    );

                },

                error: (error) => {

                    console.error(
                        '❌ Erreur ajout panier',
                        error
                    );

                    this.addingToCart = false;

                    // Si le token n'est plus valide
                    if (error.status === 401) {

                        this.authService.logout();

                        this.router.navigate(['/signin']);

                        return;
                    }

                    alert(
                        error?.error?.message
                        ?? 'Impossible d’ajouter le produit au panier.'
                    );

                }

            });
    }

}