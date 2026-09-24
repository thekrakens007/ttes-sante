import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';

import {
    ActivatedRoute,
    Router,
    RouterLink
} from '@angular/router';

import {
    BundleService
} from '../../../../core/services/bundle.service';

import {
    CartService
} from '../../../../core/services/cart.service';

import {
    AuthService
} from '../../../../core/services/auth.service';

import {
    BundleResponse
} from '../../../../core/interfaces/bundle-response.interface';

@Component({
    selector: 'app-bundle-detail',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink
    ],
    templateUrl: './bundle-detail.component.html'
})
export class BundleDetailComponent implements OnInit {

    private route = inject(ActivatedRoute);

    private router = inject(Router);

    private bundleService = inject(BundleService);

    private cartService = inject(CartService);

    private authService = inject(AuthService);

    bundle: BundleResponse | null = null;

    loading = true;

    error = '';

    addingToCart = false;

    selectedImage: string | null = null;

    ngOnInit(): void {

        const id =
            Number(
                this.route.snapshot.paramMap.get('id')
            );

        if (!id) {

            this.error =
                'Identifiant du pack invalide.';

            this.loading = false;

            return;
        }

        this.loadBundle(id);
    }

    loadBundle(id: number): void {

        this.loading = true;

        this.error = '';

        this.bundleService.getBundle(id).subscribe({

            next: (bundle) => {

                this.bundle = bundle;

                this.selectedImage =
                    this.getMainImage(bundle);

                this.loading = false;
            },

            error: (error) => {

                console.error(
                    'Erreur chargement pack :',
                    error
                );

                this.error =
                    error?.error?.message ??
                    'Impossible de charger le pack.';

                this.loading = false;
            }
        });
    }

    getMainImage(
        bundle: BundleResponse
    ): string | null {

        if (
            !bundle.images ||
            bundle.images.length === 0
        ) {
            return null;
        }

        const mainImage =
            bundle.images.find(
                image => image.main
            );

        return (
            mainImage?.imageUrl ??
            bundle.images[0]?.imageUrl ??
            null
        );
    }

    selectImage(imageUrl: string): void {

        this.selectedImage = imageUrl;
    }

    formatPrice(price: number): string {

        return new Intl.NumberFormat(
            'fr-FR'
        ).format(price) + ' FCFA';
    }

    isOutOfStock(): boolean {

        return !this.bundle ||
            this.bundle.stock <= 0;
    }

    addToCart(): void {

        if (!this.bundle) {
            return;
        }

        if (this.bundle.stock <= 0) {

            alert(
                'Ce pack est actuellement en rupture de stock.'
            );

            return;
        }

        /*
         * Vérifier que l'utilisateur
         * est connecté.
         */
        if (!this.authService.isLoggedIn()) {

            this.router.navigate(
                ['/signin'],
                {
                    queryParams: {
                        returnUrl:
                        this.router.url
                    }
                }
            );

            return;
        }

        /*
         * Empêcher les doubles clics.
         */
        if (this.addingToCart) {
            return;
        }

        this.addingToCart = true;

        this.cartService
            .addBundle(
                this.bundle.id,
                1
            )
            .subscribe({

                next: () => {

                    this.addingToCart = false;

                    alert(
                        'Pack ajouté au panier.'
                    );
                },

                error: (error) => {

                    console.error(
                        'Erreur ajout pack au panier :',
                        error
                    );

                    this.addingToCart = false;

                    /*
                     * Session expirée.
                     */
                    if (error.status === 401) {

                        this.authService.logout();

                        this.router.navigate(
                            ['/signin'],
                            {
                                queryParams: {
                                    returnUrl:
                                    this.router.url
                                }
                            }
                        );

                        return;
                    }

                    alert(
                        error?.error?.message ??
                        'Impossible d’ajouter le pack au panier.'
                    );
                }
            });
    }
}