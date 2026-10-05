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


    /* ========================================================= */
    /* ÉTAT */
    /* ========================================================= */

    addingToCart = false;

    product: Product | null = null;

    loading = true;

    error = '';


    /* ========================================================= */
    /* GALERIE */
    /* ========================================================= */

    /**
     * Image actuellement affichée
     */
    selectedImage = '';


    /* ========================================================= */
    /* DESCRIPTION */
    /* ========================================================= */

    descriptionExpanded = false;

    readonly descriptionMaxLength = 300;


    /* ========================================================= */
    /* INGREDIENTS */
    /* ========================================================= */

    ingredientsExpanded = false;

    readonly ingredientsMaxLength = 300;


    /* ========================================================= */
    /* INITIALISATION */
    /* ========================================================= */

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


    /* ========================================================= */
    /* CHARGEMENT PRODUIT */
    /* ========================================================= */

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


                    /*
                     * Réinitialiser l'état de lecture
                     * lorsque le produit est chargé.
                     */

                    this.descriptionExpanded = false;

                    this.ingredientsExpanded = false;


                    /*
                     * Sélectionner automatiquement
                     * la première image du produit.
                     */

                    if (
                        product.images &&
                        product.images.length > 0
                    ) {

                        this.selectedImage =
                            product.images[0].imageUrl;

                    } else {

                        this.selectedImage = '';

                    }


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


    /* ========================================================= */
    /* GALERIE */
    /* ========================================================= */

    /**
     * Change l'image principale.
     */
    selectImage(imageUrl: string): void {

        this.selectedImage = imageUrl;

    }


    /* ========================================================= */
    /* DESCRIPTION - LIRE PLUS */
    /* ========================================================= */

    /**
     * Vérifie si la description est suffisamment
     * longue pour afficher "Lire plus".
     */
    get descriptionNeedsReadMore(): boolean {

        return !!this.product?.description &&
            this.product.description.length >
            this.descriptionMaxLength;

    }


    /**
     * Texte de description à afficher.
     */
    get displayedDescription(): string {

        if (!this.product?.description) {

            return '';

        }


        /*
         * Si l'utilisateur a demandé
         * à voir tout le texte.
         */

        if (this.descriptionExpanded) {

            return this.product.description;

        }


        /*
         * Si le texte est suffisamment court,
         * on l'affiche entièrement.
         */

        if (
            this.product.description.length <=
            this.descriptionMaxLength
        ) {

            return this.product.description;

        }


        /*
         * Sinon, on affiche seulement
         * les 300 premiers caractères.
         */

        return (
            this.product.description
                .substring(
                    0,
                    this.descriptionMaxLength
                )
                .trimEnd()
            + '...'
        );

    }


    /**
     * Affiche ou masque la description complète.
     */
    toggleDescription(): void {

        this.descriptionExpanded =
            !this.descriptionExpanded;

    }


    /* ========================================================= */
    /* INGREDIENTS - LIRE PLUS */
    /* ========================================================= */

    /**
     * Vérifie si les ingrédients sont suffisamment
     * longs pour afficher "Lire plus".
     */
    get ingredientsNeedsReadMore(): boolean {

        return !!this.product?.ingredients &&
            this.product.ingredients.length >
            this.ingredientsMaxLength;

    }


    /**
     * Texte des ingrédients à afficher.
     */
    get displayedIngredients(): string {

        if (!this.product?.ingredients) {

            return '';

        }


        /*
         * Afficher tous les ingrédients.
         */

        if (this.ingredientsExpanded) {

            return this.product.ingredients;

        }


        /*
         * Si le texte est suffisamment court,
         * afficher tout.
         */

        if (
            this.product.ingredients.length <=
            this.ingredientsMaxLength
        ) {

            return this.product.ingredients;

        }


        /*
         * Sinon, afficher seulement
         * les 300 premiers caractères.
         */

        return (
            this.product.ingredients
                .substring(
                    0,
                    this.ingredientsMaxLength
                )
                .trimEnd()
            + '...'
        );

    }


    /**
     * Affiche ou masque tous les ingrédients.
     */
    toggleIngredients(): void {

        this.ingredientsExpanded =
            !this.ingredientsExpanded;

    }


    /* ========================================================= */
    /* PANIER */
    /* ========================================================= */

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


        /*
         * Vérifier si le client est connecté.
         */

        if (!this.authService.isLoggedIn()) {

            alert(
                'Vous devez créer un compte ou vous connecter pour ajouter un produit au panier.'
            );

            this.router.navigate([
                '/signin'
            ]);

            return;

        }


        /*
         * Éviter les doubles clics.
         */

        if (this.addingToCart) {

            return;

        }


        this.addingToCart = true;


        this.cartService
            .addItem(
                this.product.id,
                1
            )
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


                    /*
                     * Token expiré / invalide.
                     */

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


    /* ========================================================= */
    /* PRIX */
    /* ========================================================= */

    formatPrice(price: number): string {

        return new Intl.NumberFormat(
            'fr-FR'
        ).format(price) + ' FCFA';

    }

}
