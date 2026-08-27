import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
    ActivatedRoute,
    Router,
    RouterLink
} from '@angular/router';

import { ProductService } from '../../../core/services/product.service';

import { Product } from '../../../core/models/product.model';

import { CartService } from '../../../core/services/cart.service';

import { AuthService } from '../../../core/services/auth.service';


@Component({
    selector: 'app-product-detail',

    standalone: true,

    imports: [
        CommonModule,
        RouterLink
    ],

    templateUrl: './product-detail.component.html'
})
export class ProductDetailComponent implements OnInit {

    private route = inject(ActivatedRoute);

    private productService = inject(ProductService);

    private cartService = inject(CartService);

    private authService = inject(AuthService);

    private router = inject(Router);


    addingToCart = false;

    product: Product | null = null;

    loading = true;

    error = '';


    ngOnInit(): void {

        const id =
            this.route.snapshot.paramMap.get('id');

        if (!id) {

            this.error =
                'Produit introuvable.';

            this.loading = false;

            return;
        }

        this.loadProduct(Number(id));

    }


    loadProduct(id: number): void {

        this.loading = true;

        this.error = '';

        this.productService
            .getProduct(id)
            .subscribe({

                next: (product) => {

                    console.log(
                        'Produit détail :',
                        product
                    );

                    this.product = product;

                    this.loading = false;

                },

                error: (error) => {

                    console.error(
                        'Erreur chargement produit :',
                        error
                    );

                    this.error =
                        error?.error?.message ??
                        'Impossible de charger le produit.';

                    this.loading = false;

                }

            });

    }


    addToCart(): void {

        console.log(
            '🔥 CLICK SUR AJOUTER AU PANIER'
        );

        if (
            !this.product ||
            this.product.stock <= 0
        ) {
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


                    // Token expiré / invalide

                    if (error.status === 401) {

                        this.authService.logout();

                        this.router.navigate([
                            '/signin'
                        ]);

                        return;
                    }


                    alert(
                        error?.error?.message ??
                        'Impossible d’ajouter le produit au panier.'
                    );

                }

            });

    }


    formatPrice(price: number): string {

        return new Intl.NumberFormat(
            'fr-FR'
        ).format(price) + ' FCFA';

    }

}