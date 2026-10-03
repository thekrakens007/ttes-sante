import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';

import {
    FormsModule,
    ReactiveFormsModule,
    FormBuilder,
    Validators
} from '@angular/forms';

import {
    ActivatedRoute,
    Router,
    RouterModule
} from '@angular/router';

import { BundleService } from '../../../../core/services/bundle.service';
import { ProductService } from '../../../../core/services/product.service';

import { Product } from '../../../../core/models/product.model';


interface BundleFormItem {
    productId: number;
    quantity: number;
}


interface BundleFormImage {
    url: string;
    altText?: string;
}


@Component({
    selector: 'app-bundle-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule
    ],
    templateUrl: './bundle-form.component.html'
})
export class BundleFormComponent implements OnInit {

    private fb = inject(FormBuilder);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    private bundleService = inject(BundleService);
    private productService = inject(ProductService);


    // ============================================================
    // ETAT
    // ============================================================

    isEditMode = false;

    bundleId: number | null = null;

    loading = false;
    saving = false;

    error = '';
    success = '';


    // ============================================================
    // PRODUITS
    // ============================================================

    products: Product[] = [];

    selectedItems: BundleFormItem[] = [];

    productToAdd: number | null = null;

    quantityToAdd = 1;


    // ============================================================
    // IMAGES
    // ============================================================

    images: BundleFormImage[] = [];


    // ============================================================
    // FORMULAIRE
    // ============================================================

    form = this.fb.group({

        name: [
            '',
            [
                Validators.required,
                Validators.maxLength(255)
            ]
        ],

        description: [
            ''
        ],

        price: [
            0,
            [
                Validators.required,
                Validators.min(0)
            ]
        ],

        active: [
            true
        ]

    });


    // ============================================================
    // INIT
    // ============================================================

    ngOnInit(): void {

        const id = this.route.snapshot.paramMap.get('id');


        /*
         * ========================================================
         * MODE MODIFICATION
         * ========================================================
         */

        if (id) {

            this.isEditMode = true;

            this.bundleId = Number(id);

        }


        /*
         * ========================================================
         * MODE CREATION
         * ========================================================
         *
         * Si on arrive depuis la liste des produits :
         *
         * /admin/bundles/new?productIds=1&productIds=5&productIds=8
         *
         * alors les produits sont automatiquement ajoutés.
         */

        else {

            const productIds = this.route
                .snapshot
                .queryParamMap
                .getAll('productIds')
                .map(value => Number(value))
                .filter(
                    productId =>
                        Number.isInteger(productId) &&
                        productId > 0
                );


            this.initializeSelectedProducts(productIds);

        }


        // Charger la liste des produits
        this.loadProducts();


        /*
         * En mode modification, charger le pack existant.
         */

        if (
            this.isEditMode &&
            this.bundleId
        ) {

            this.loadBundle(this.bundleId);

        }

    }


    // ============================================================
    // INITIALISATION DES PRODUITS SELECTIONNES
    // ============================================================

    private initializeSelectedProducts(
        productIds: number[]
    ): void {

        /*
         * Set pour éviter les doublons.
         */

        const uniqueIds = [
            ...new Set(productIds)
        ];


        /*
         * Chaque produit sélectionné depuis la liste
         * arrive avec une quantité de 1.
         */

        this.selectedItems = uniqueIds.map(
            productId => ({
                productId,
                quantity: 1
            })
        );

    }


    // ============================================================
    // CHARGEMENT PRODUITS
    // ============================================================

    loadProducts(): void {

        this.loading = true;

        this.productService.getProducts().subscribe({

            next: (products: Product[]) => {

                this.products = products ?? [];

                this.loading = false;

            },

            error: (error) => {

                console.error(
                    'Erreur chargement produits :',
                    error
                );

                this.error =
                    'Impossible de charger les produits.';

                this.loading = false;

            }

        });

    }


    // ============================================================
    // CHARGEMENT PACK
    // ============================================================

    loadBundle(id: number): void {

        this.loading = true;

        this.bundleService.getAdminBundle(id).subscribe({

            next: (bundle: any) => {

                this.fillForm(bundle);

                this.loading = false;

            },

            error: (error) => {

                console.error(
                    'Erreur chargement pack :',
                    error
                );

                this.error =
                    'Impossible de charger le pack.';

                this.loading = false;

            }

        });

    }


    // ============================================================
    // REMPLIR FORMULAIRE
    // ============================================================

    fillForm(bundle: any): void {

        this.form.patchValue({

            name: bundle.name ?? '',

            description:
                bundle.description ?? '',

            price:
                bundle.price ?? 0,

            active:
                bundle.active ?? true

        });


        /*
         * Produits du pack
         */

        this.selectedItems =
            (bundle.items ?? []).map(
                (item: any) => ({

                    productId:
                        item.productId ??
                        item.product?.id,

                    quantity:
                        item.quantity ?? 1

                })
            );


        /*
         * Images du pack
         */

        this.images =
            (bundle.images ?? []).map(
                (image: any) => ({

                    url:
                        image.url ?? '',

                    altText:
                        image.altText ?? ''

                })
            );

    }


    // ============================================================
    // AJOUT PRODUIT
    // ============================================================

    addProduct(): void {

        if (
            !this.productToAdd ||
            this.productToAdd <= 0
        ) {
            return;
        }


        /*
         * Vérifier si le produit existe déjà.
         */

        const alreadyExists =
            this.selectedItems.some(
                item =>
                    item.productId === this.productToAdd
            );


        if (alreadyExists) {

            this.error =
                'Ce produit est déjà présent dans le pack.';

            return;

        }


        /*
         * Vérifier quantité.
         */

        if (
            !this.quantityToAdd ||
            this.quantityToAdd < 1
        ) {

            this.error =
                'La quantité doit être supérieure à 0.';

            return;

        }


        /*
         * Ajouter le produit.
         */

        this.selectedItems.push({

            productId: this.productToAdd,

            quantity: this.quantityToAdd

        });


        /*
         * Reset.
         */

        this.productToAdd = null;

        this.quantityToAdd = 1;

        this.error = '';

    }


    // ============================================================
    // SUPPRIMER PRODUIT
    // ============================================================

    removeProduct(index: number): void {

        this.selectedItems.splice(index, 1);

    }


    // ============================================================
    // MODIFIER QUANTITE
    // ============================================================

    updateProductQuantity(
        index: number,
        quantity: number
    ): void {

        if (!Number.isFinite(quantity)) {
            quantity = 1;
        }


        quantity = Math.floor(quantity);


        if (quantity < 1) {
            quantity = 1;
        }


        this.selectedItems[index].quantity =
            quantity;

    }


    // ============================================================
    // RECUPERER PRODUIT
    // ============================================================

    getProduct(
        productId: number
    ): Product | undefined {

        return this.products.find(
            product =>
                product.id === productId
        );

    }


    // ============================================================
    // NOM PRODUIT
    // ============================================================

    getProductName(
        productId: number
    ): string {

        const product =
            this.getProduct(productId);


        if (product) {

            return product.name;

        }


        return `Produit #${productId}`;

    }


    // ============================================================
    // STOCK PRODUIT
    // ============================================================

    getProductStock(
        productId: number
    ): number | null {

        const product =
            this.getProduct(productId);


        if (!product) {
            return null;
        }


        /*
         * Selon ton modèle Product,
         * le stock peut être directement disponible.
         */

        const productWithStock =
            product as Product & {
                stock?: number;
            };


        return productWithStock.stock ?? null;

    }


    // ============================================================
    // AJOUT IMAGE
    // ============================================================

    addImage(): void {

        this.images.push({

            url: '',

            altText: ''

        });

    }


    // ============================================================
    // SUPPRESSION IMAGE
    // ============================================================

    removeImage(index: number): void {

        this.images.splice(index, 1);

    }


    // ============================================================
    // IMAGE URL
    // ============================================================

    updateImageUrl(
        index: number,
        value: string
    ): void {

        if (!this.images[index]) {
            return;
        }

        this.images[index].url = value;

    }


    // ============================================================
    // IMAGE ALT
    // ============================================================

    updateImageAlt(
        index: number,
        value: string
    ): void {

        if (!this.images[index]) {
            return;
        }

        this.images[index].altText = value;

    }


    // ============================================================
    // SAUVEGARDE
    // ============================================================

    save(): void {

        this.error = '';
        this.success = '';


        // --------------------------------------------------------
        // Validation formulaire
        // --------------------------------------------------------

        if (this.form.invalid) {

            this.form.markAllAsTouched();

            this.error =
                'Veuillez remplir correctement les informations du pack.';

            return;

        }


        // --------------------------------------------------------
        // Vérifier produits
        // --------------------------------------------------------

        if (
            !this.selectedItems ||
            this.selectedItems.length === 0
        ) {

            this.error =
                'Veuillez sélectionner au moins un produit pour le pack.';

            return;

        }


        // --------------------------------------------------------
        // Vérifier quantités
        // --------------------------------------------------------

        const invalidQuantity =
            this.selectedItems.some(
                item =>
                    !Number.isInteger(item.quantity) ||
                    item.quantity < 1
            );


        if (invalidQuantity) {

            this.error =
                'Toutes les quantités doivent être supérieures à 0.';

            return;

        }


        // --------------------------------------------------------
        // Vérifier images
        // --------------------------------------------------------

        const invalidImage =
            this.images.some(
                image =>
                    !image.url ||
                    !image.url.trim()
            );


        if (invalidImage) {

            this.error =
                'Toutes les images doivent avoir une URL valide.';

            return;

        }


        // --------------------------------------------------------
        // Récupérer valeurs
        // --------------------------------------------------------

        const formValue =
            this.form.getRawValue();


        // --------------------------------------------------------
        // Construire requête
        // --------------------------------------------------------

        const request = {

            name:
                formValue.name?.trim() ?? '',

            description:
                formValue.description?.trim() ?? '',

            price:
                Number(formValue.price ?? 0),

            active:
                formValue.active ?? true,

            items:
                this.selectedItems.map(
                    item => ({

                        productId:
                            item.productId,

                        quantity:
                            item.quantity

                    })
                ),

            images:
                this.images.map(
                    image => ({

                        url:
                            image.url.trim(),

                        altText:
                            image.altText?.trim() ?? ''

                    })
                )

        };


        // --------------------------------------------------------
        // Sauvegarde
        // --------------------------------------------------------

        this.saving = true;


        if (
            this.isEditMode &&
            this.bundleId
        ) {

            this.bundleService
                .updateBundle(
                    this.bundleId,
                    request
                )
                .subscribe({

                    next: () => {

                        this.saving = false;

                        this.success =
                            'Pack modifié avec succès.';

                        setTimeout(() => {

                            this.router.navigate(
                                ['/admin/bundles']
                            );

                        }, 800);

                    },

                    error: (error) => {

                        console.error(
                            'Erreur modification pack :',
                            error
                        );

                        this.saving = false;

                        this.error =
                            error?.error?.message ??
                            'Impossible de modifier le pack.';

                    }

                });

        }

        else {

            this.bundleService
                .createBundle(request)
                .subscribe({

                    next: () => {

                        this.saving = false;

                        this.success =
                            'Pack créé avec succès.';

                        setTimeout(() => {

                            this.router.navigate(
                                ['/admin/bundles']
                            );

                        }, 800);

                    },

                    error: (error) => {

                        console.error(
                            'Erreur création pack :',
                            error
                        );

                        this.saving = false;

                        this.error =
                            error?.error?.message ??
                            'Impossible de créer le pack.';

                    }

                });

        }

    }

}
