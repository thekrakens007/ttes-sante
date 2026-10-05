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

import { forkJoin } from 'rxjs';

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

    isEditMode = false;
    bundleId: number | null = null;

    loading = false;
    saving = false;

    error = '';
    success = '';

    /**
     * Produits disponibles.
     */
    products: Product[] = [];

    /**
     * Produits présents dans le pack.
     */
    selectedItems: BundleFormItem[] = [];

    /**
     * Produit sélectionné dans le sélecteur
     * "Ajouter un autre produit".
     */
    productToAdd: number | null = null;

    /**
     * Quantité du produit à ajouter.
     */
    quantityToAdd = 1;

    /**
     * Images du pack.
     *
     * En création :
     * les images principales des produits sélectionnés
     * sont ajoutées automatiquement.
     *
     * En modification :
     * les images déjà enregistrées du pack sont conservées.
     */
    images: BundleFormImage[] = [];

    /**
     * Formulaire principal.
     */
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


    // =========================================================
    // INITIALISATION
    // =========================================================

    ngOnInit(): void {

        const id =
            this.route.snapshot.paramMap.get('id');


        /*
         * =====================================================
         * MODE MODIFICATION
         * =====================================================
         */

        if (id) {

            this.isEditMode = true;
            this.bundleId = Number(id);

            this.loadProducts();

            if (this.bundleId) {
                this.loadBundle(this.bundleId);
            }

            return;
        }


        /*
         * =====================================================
         * MODE CRÉATION
         * =====================================================
         */

        const productIds =
            this.route.snapshot.queryParamMap
                .getAll('productIds')
                .map(value => Number(value))
                .filter(productId =>
                    Number.isInteger(productId) &&
                    productId > 0
                );


        /*
         * Initialise les produits sélectionnés
         * avec quantité = 1.
         */
        this.initializeSelectedProducts(
            productIds
        );


        /*
         * Récupère directement les produits sélectionnés
         * par leur ID.
         *
         * Cela permet de récupérer leurs noms,
         * leurs images, leur stock, etc.
         */
        this.loadSelectedProducts(
            productIds
        );


        /*
         * Charge également la liste générale des produits
         * pour le sélecteur d'ajout manuel.
         */
        this.loadProducts();
    }


    // =========================================================
    // INITIALISATION DES PRODUITS SÉLECTIONNÉS
    // =========================================================

    private initializeSelectedProducts(
        productIds: number[]
    ): void {

        const uniqueIds =
            [...new Set(productIds)];


        this.selectedItems =
            uniqueIds.map(productId => ({

                productId,

                quantity: 1

            }));
    }


    // =========================================================
    // CHARGER LES PRODUITS SÉLECTIONNÉS
    // =========================================================

    private loadSelectedProducts(
        productIds: number[]
    ): void {

        if (productIds.length === 0) {
            return;
        }


        this.loading = true;
        this.error = '';


        /*
         * Un appel API par produit sélectionné.
         *
         * Exemple :
         *
         * GET /api/products/161
         * GET /api/products/143
         * GET /api/products/162
         */
        const requests =
            productIds.map(productId =>
                this.productService.getProduct(
                    productId
                )
            );


        forkJoin(requests).subscribe({

            next: (loadedProducts: Product[]) => {

                for (const product of loadedProducts) {

                    this.addProductToLocalList(
                        product
                    );


                    /*
                     * Ajoute automatiquement l'image
                     * principale du produit aux images
                     * du pack.
                     */
                    this.addProductMainImage(
                        product
                    );
                }


                this.loading = false;
            },


            error: (error) => {

                console.error(
                    'Erreur chargement des produits sélectionnés :',
                    error
                );


                this.loading = false;


                this.error =
                    'Impossible de charger les produits sélectionnés.';
            }
        });
    }


    // =========================================================
    // AJOUTER PRODUIT À LA LISTE LOCALE
    // =========================================================

    private addProductToLocalList(
        product: Product
    ): void {

        const alreadyLoaded =
            this.products.some(
                existingProduct =>
                    existingProduct.id === product.id
            );


        if (!alreadyLoaded) {

            this.products.push(
                product
            );
        }
    }


    // =========================================================
    // AJOUT AUTOMATIQUE DE L'IMAGE DU PRODUIT
    // =========================================================

    private addProductMainImage(
        product: Product
    ): void {

        /*
         * Le produit n'a aucune image.
         */
        if (
            !product.images ||
            product.images.length === 0
        ) {
            return;
        }


        /*
         * On privilégie l'image marquée "main".
         *
         * Si aucune image principale n'existe,
         * on prend la première.
         */
        const mainImage =
            product.images.find(
                image => image.main
            ) ??
            product.images[0];


        if (!mainImage?.imageUrl) {
            return;
        }


        /*
         * Évite les doublons.
         */
        const alreadyExists =
            this.images.some(
                image =>
                    image.imageUrl ===
                    mainImage.imageUrl
            );


        if (alreadyExists) {
            return;
        }


        /*
         * La première image devient automatiquement
         * l'image principale du pack.
         */
        this.images.push({

            imageUrl:
                mainImage.imageUrl,

            main:
                this.images.length === 0,

            displayOrder:
                this.images.length
        });
    }


    // =========================================================
    // CHARGER TOUS LES PRODUITS
    // =========================================================

    loadProducts(): void {

        this.productService
            .getProducts()
            .subscribe({

                next: (products: Product[]) => {

                    const loadedProducts =
                        products ?? [];


                    for (
                        const product
                        of loadedProducts
                    ) {

                        this.addProductToLocalList(
                            product
                        );
                    }
                },


                error: (error) => {

                    console.error(
                        'Erreur chargement produits :',
                        error
                    );


                    /*
                     * Si les produits sélectionnés
                     * ont déjà été récupérés correctement,
                     * on ne remplace pas leur état.
                     */
                    if (!this.error) {

                        this.error =
                            'Impossible de charger les produits.';
                    }
                }
            });
    }


    // =========================================================
    // CHARGER LE PACK EN MODE MODIFICATION
    // =========================================================

    loadBundle(
        id: number
    ): void {

        this.loading = true;


        this.bundleService
            .getAdminBundle(id)
            .subscribe({

                next: (bundle: any) => {

                    this.fillForm(
                        bundle
                    );


                    /*
                     * Récupère les produits du pack
                     * qui ne seraient pas présents
                     * dans la liste générale.
                     */
                    const productIds =
                        this.selectedItems.map(
                            item =>
                                item.productId
                        );


                    this.loadSelectedProductsForEdit(
                        productIds
                    );


                    this.loading = false;
                },


                error: (error) => {

                    console.error(
                        'Erreur chargement pack :',
                        error
                    );


                    this.loading = false;


                    this.error =
                        'Impossible de charger le pack.';
                }
            });
    }


    // =========================================================
    // CHARGER LES PRODUITS DU PACK EN MODIFICATION
    // =========================================================

    private loadSelectedProductsForEdit(
        productIds: number[]
    ): void {

        const missingIds =
            productIds.filter(
                productId =>
                    !this.products.some(
                        product =>
                            product.id ===
                            productId
                    )
            );


        if (missingIds.length === 0) {
            return;
        }


        const requests =
            missingIds.map(
                productId =>
                    this.productService.getProduct(
                        productId
                    )
            );


        forkJoin(requests).subscribe({

            next: (loadedProducts: Product[]) => {

                for (
                    const product
                    of loadedProducts
                ) {

                    this.addProductToLocalList(
                        product
                    );
                }
            },


            error: (error) => {

                console.error(
                    'Erreur chargement produits du pack :',
                    error
                );
            }
        });
    }


    // =========================================================
    // REMPLIR LE FORMULAIRE
    // =========================================================

    fillForm(
        bundle: any
    ): void {

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


        /*
         * Produits du pack.
         */
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


        /*
         * Images déjà enregistrées
         * pour le pack.
         */
        this.images =
            (bundle.images ?? [])
                .map(
                    (
                        image: any,
                        index: number
                    ) => ({

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


    // =========================================================
    // AJOUTER UN PRODUIT MANUELLEMENT
    // =========================================================

    addProduct(): void {

        if (
            !this.productToAdd ||
            this.productToAdd <= 0
        ) {
            return;
        }


        const productId =
            this.productToAdd;


        /*
         * Vérifie si le produit est déjà présent.
         */
        const alreadyExists =
            this.selectedItems.some(
                item =>
                    item.productId ===
                    productId
            );


        if (alreadyExists) {

            this.error =
                'Ce produit est déjà présent dans le pack.';

            return;
        }


        /*
         * Vérifie la quantité.
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
         * Ajout du produit au pack.
         */
        this.selectedItems.push({

            productId,

            quantity:
                Math.floor(
                    this.quantityToAdd
                )
        });


        /*
         * Vérifie si le produit est déjà chargé.
         */
        const product =
            this.getProduct(
                productId
            );


        if (product) {

            /*
             * Ajoute automatiquement son image principale.
             */
            this.addProductMainImage(
                product
            );

        } else {

            /*
             * Sécurité : si le produit n'est pas
             * dans la liste locale, on le récupère.
             */
            this.productService
                .getProduct(productId)
                .subscribe({

                    next: (
                        loadedProduct: Product
                    ) => {

                        this.addProductToLocalList(
                            loadedProduct
                        );


                        this.addProductMainImage(
                            loadedProduct
                        );
                    },


                    error: (error) => {

                        console.error(
                            'Erreur chargement du produit :',
                            error
                        );
                    }
                });
        }


        this.productToAdd = null;
        this.quantityToAdd = 1;

        this.error = '';
    }


    // =========================================================
    // SUPPRIMER UN PRODUIT
    // =========================================================

    removeProduct(
        index: number
    ): void {

        this.selectedItems.splice(
            index,
            1
        );
    }


    // =========================================================
    // MODIFIER LA QUANTITÉ
    // =========================================================

    updateProductQuantity(
        index: number,
        quantity: number
    ): void {

        if (!Number.isFinite(quantity)) {

            quantity = 1;
        }


        quantity =
            Math.floor(quantity);


        if (quantity < 1) {

            quantity = 1;
        }


        if (!this.selectedItems[index]) {
            return;
        }


        this.selectedItems[index].quantity =
            quantity;
    }


    // =========================================================
    // RÉCUPÉRER UN PRODUIT
    // =========================================================

    getProduct(
        productId: number
    ): Product | undefined {

        return this.products.find(
            product =>
                product.id ===
                productId
        );
    }


    // =========================================================
    // NOM DU PRODUIT
    // =========================================================

    getProductName(
        productId: number
    ): string {

        const product =
            this.getProduct(
                productId
            );


        if (product) {

            return product.name;
        }


        return `Produit #${productId}`;
    }


    // =========================================================
    // IMAGE PRINCIPALE DU PRODUIT
    // =========================================================

    getMainImage(
        productId: number
    ): string {

        const product =
            this.getProduct(
                productId
            );


        if (
            !product?.images ||
            product.images.length === 0
        ) {

            return '';
        }


        const mainImage =
            product.images.find(
                image =>
                    image.main
            );


        return (
            mainImage?.imageUrl ??
            product.images[0]?.imageUrl ??
            ''
        );
    }


    // =========================================================
    // STOCK DU PRODUIT
    // =========================================================

    getProductStock(
        productId: number
    ): number | null {

        const product =
            this.getProduct(
                productId
            );


        if (!product) {

            return null;
        }


        return product.stock ?? null;
    }


    // =========================================================
    // AJOUTER UNE IMAGE MANUELLEMENT
    // =========================================================

    addImage(): void {

        this.images.push({

            imageUrl: '',

            /*
             * Si aucune image n'existe encore,
             * cette nouvelle image devient principale.
             */
            main:
                this.images.length === 0,

            displayOrder:
                this.images.length
        });
    }


    // =========================================================
    // SUPPRIMER UNE IMAGE
    // =========================================================

    removeImage(
        index: number
    ): void {

        this.images.splice(
            index,
            1
        );


        /*
         * Réindexation.
         */
        this.images.forEach(
            (image, i) => {

                image.displayOrder =
                    i;
            }
        );


        /*
         * S'il n'existe plus d'image principale,
         * la première devient principale.
         */
        if (
            this.images.length > 0 &&
            !this.images.some(
                image =>
                    image.main
            )
        ) {

            this.images[0].main =
                true;
        }
    }


    // =========================================================
    // MODIFIER URL IMAGE
    // =========================================================

    updateImageUrl(
        index: number,
        value: string
    ): void {

        if (!this.images[index]) {
            return;
        }


        this.images[index].imageUrl =
            value;
    }


    // =========================================================
    // CHOISIR IMAGE PRINCIPALE
    // =========================================================

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


    // =========================================================
    // ENREGISTRER
    // =========================================================

    save(): void {

        this.error = '';
        this.success = '';


        /*
         * Validation formulaire.
         */
        if (this.form.invalid) {

            this.form.markAllAsTouched();

            this.error =
                'Veuillez remplir correctement les informations du pack.';

            return;
        }


        /*
         * Il faut au moins un produit.
         */
        if (
            !this.selectedItems ||
            this.selectedItems.length === 0
        ) {

            this.error =
                'Veuillez sélectionner au moins un produit pour le pack.';

            return;
        }


        /*
         * Vérification des quantités.
         */
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


        /*
         * Vérification des URLs d'images.
         */
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


        const formValue =
            this.form.getRawValue();


        /*
         * Construction de la requête.
         */
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
                    (
                        image,
                        index
                    ) => ({

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


        this.saving = true;


        // =====================================================
        // MODIFICATION
        // =====================================================

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


            return;
        }


        // =====================================================
        // CRÉATION
        // =====================================================

        this.bundleService
            .createBundle(
                request
            )
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
