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
    imageUrl: string;
    main: boolean;
    displayOrder: number;
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

        const id =
            this.route.snapshot.paramMap.get('id');


        // --------------------------------------------------------
        // MODE MODIFICATION
        // --------------------------------------------------------

        if (id) {

            this.isEditMode = true;

            this.bundleId = Number(id);

        }


        // --------------------------------------------------------
        // MODE CREATION
        // --------------------------------------------------------

        else {

            const productIds =
                this.route
                    .snapshot
                    .queryParamMap
                    .getAll('productIds')
                    .map(value => Number(value))
                    .filter(
                        productId =>
                            Number.isInteger(productId) &&
                            productId > 0
                    );


            this.initializeSelectedProducts(
                productIds
            );

        }


        // Charger les produits
        this.loadProducts();


        // Charger le pack en modification
        if (
            this.isEditMode &&
            this.bundleId
        ) {

            this.loadBundle(
                this.bundleId
            );

        }

    }


    // ============================================================
    // INITIALISATION PRODUITS SELECTIONNES
    // ============================================================

    private initializeSelectedProducts(
        productIds: number[]
    ): void {

        const uniqueIds = [
            ...new Set(productIds)
        ];


        this.selectedItems =
            uniqueIds.map(productId => ({
                productId,
                quantity: 1
            }));

    }


    // ============================================================
    // CHARGEMENT PRODUITS
    // ============================================================

    loadProducts(): void {

        this.loading = true;

        this.productService
            .getProducts()
            .subscribe({

                next: (products: Product[]) => {

                    this.products =
                        products ?? [];

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

        this.bundleService
            .getAdminBundle(id)
            .subscribe({

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

            name:
                bundle.name ?? '',

            description:
                bundle.description ?? '',

            price:
                bundle.price ?? 0,

            active:
                bundle.active ?? true

        });


        // --------------------------------------------------------
        // PRODUITS
        // --------------------------------------------------------

        this.selectedItems =
            (bundle.items ?? [])
                .map((item: any) => ({

                    productId:
                        item.productId ??
                        item.product?.id,

                    quantity:
                        item.quantity ?? 1

                }))
                .filter(
                    (item: BundleFormItem) =>
                        Number.isInteger(
                            item.productId
                        ) &&
                        item.productId > 0
                );


        // --------------------------------------------------------
        // IMAGES
        // --------------------------------------------------------

        this.images =
            (bundle.images ?? [])
                .map(
                    (image: any, index: number) => ({

                        imageUrl:
                            image.imageUrl ??
                            image.url ??
                            '',

                        main:
                            image.main ??
                            index === 0,

                        displayOrder:
                            image.displayOrder ??
                            index

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


        const alreadyExists =
            this.selectedItems.some(
                item =>
                    item.productId ===
                    this.productToAdd
            );


        if (alreadyExists) {

            this.error =
                'Ce produit est déjà présent dans le pack.';

            return;

        }


        if (
            !this.quantityToAdd ||
            this.quantityToAdd < 1
        ) {

            this.error =
                'La quantité doit être supérieure à 0.';

            return;

        }


        this.selectedItems.push({

            productId:
                this.productToAdd,

            quantity:
                Math.floor(
                    this.quantityToAdd
                )

        });


        this.productToAdd = null;

        this.quantityToAdd = 1;

        this.error = '';

    }


    // ============================================================
    // SUPPRIMER PRODUIT
    // ============================================================

    removeProduct(
        index: number
    ): void {

        this.selectedItems.splice(
            index,
            1
        );

    }


    // ============================================================
    // MODIFIER QUANTITE
    // ============================================================

    updateProductQuantity(
        index: number,
        quantity: number
    ): void {

        if (
            !Number.isFinite(quantity)
        ) {
            quantity = 1;
        }


        quantity =
            Math.floor(quantity);


        if (quantity < 1) {
            quantity = 1;
        }


        if (
            !this.selectedItems[index]
        ) {
            return;
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
    // IMAGE PRINCIPALE DU PRODUIT
    // ============================================================

    getMainImage(
        productId: number
    ): string {

        const product =
            this.getProduct(productId);


        if (
            !product?.images ||
            product.images.length === 0
        ) {
            return '';
        }


        const mainImage =
            product.images.find(
                image => image.main
            );


        return (
            mainImage?.imageUrl ??
            product.images[0]?.imageUrl ??
            ''
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


        return product.stock ?? null;

    }


    // ============================================================
    // AJOUT IMAGE
    // ============================================================

    addImage(): void {

        this.images.push({

            imageUrl: '',

            main:
                this.images.length === 0,

            displayOrder:
                this.images.length

        });

    }


    // ============================================================
    // SUPPRESSION IMAGE
    // ============================================================

    removeImage(
        index: number
    ): void {

        this.images.splice(
            index,
            1
        );


        this.images.forEach(
            (image, i) => {

                image.displayOrder = i;

            }
        );


        if (
            this.images.length > 0 &&
            !this.images.some(
                image => image.main
            )
        ) {

            this.images[0].main = true;

        }

    }


    // ============================================================
    // IMAGE URL
    // ============================================================

    updateImageUrl(
        index: number,
        value: string
    ): void {

        if (
            !this.images[index]
        ) {
            return;
        }


        this.images[index].imageUrl =
            value;

    }


    // ============================================================
    // IMAGE PRINCIPALE
    // ============================================================

    setMainImage(
        index: number
    ): void {

        this.images.forEach(
            (image, i) => {

                image.main =
                    i === index;

            }
        );

    }


    // ============================================================
    // SAUVEGARDE
    // ============================================================

    save(): void {

        this.error = '';

        this.success = '';


        // --------------------------------------------------------
        // VALIDATION FORMULAIRE
        // --------------------------------------------------------

        if (this.form.invalid) {

            this.form.markAllAsTouched();

            this.error =
                'Veuillez remplir correctement les informations du pack.';

            return;

        }


        // --------------------------------------------------------
        // VERIFIER PRODUITS
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
        // VERIFIER QUANTITES
        // --------------------------------------------------------

        const invalidQuantity =
            this.selectedItems.some(
                item =>
                    !Number.isInteger(
                        item.quantity
                    ) ||
                    item.quantity < 1
            );


        if (invalidQuantity) {

            this.error =
                'Toutes les quantités doivent être supérieures à 0.';

            return;

        }


        // --------------------------------------------------------
        // VERIFIER IMAGES
        // --------------------------------------------------------

        const invalidImage =
            this.images.some(
                image =>
                    !image.imageUrl ||
                    !image.imageUrl.trim()
            );


        if (invalidImage) {

            this.error =
                'Toutes les images doivent avoir une URL valide.';

            return;

        }


        // --------------------------------------------------------
        // VALEURS FORMULAIRE
        // --------------------------------------------------------

        const formValue =
            this.form.getRawValue();


        // --------------------------------------------------------
        // CONSTRUIRE REQUETE
        // --------------------------------------------------------

        const request = {

            name:
                formValue.name?.trim() ?? '',

            description:
                formValue.description?.trim() ?? '',

            price:
                Number(
                    formValue.price ?? 0
                ),

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
                    (image, index) => ({

                        imageUrl:
                            image.imageUrl.trim(),

                        main:
                            image.main,

                        displayOrder:
                            image.displayOrder ??
                            index

                    })
                )

        };


        // --------------------------------------------------------
        // SAUVEGARDE
        // --------------------------------------------------------

        this.saving = true;


        // --------------------------------------------------------
        // MODIFICATION
        // --------------------------------------------------------

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


        // --------------------------------------------------------
        // CREATION
        // --------------------------------------------------------

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
