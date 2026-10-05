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


interface BundleDraft {
    name: string;
    description: string;
    price: number;
    active: boolean;
    selectedItems: BundleFormItem[];
    images: BundleFormImage[];
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


    /*
     * Clé utilisée pour conserver temporairement
     * le brouillon du pack pendant la sélection
     * de nouveaux produits.
     */
    private readonly DRAFT_STORAGE_KEY =
        'ttes_bundle_creation_draft';


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
     * Images du pack.
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

            this.clearDraft();

            this.loadProducts();

            if (this.bundleId) {

                this.loadBundle(
                    this.bundleId
                );
            }

            return;
        }


        /*
         * =====================================================
         * MODE CRÉATION
         * =====================================================
         */

        const productIds =
            this.getProductIdsFromQueryParams();


        /*
         * Vérifie si nous revenons de la liste
         * des produits après avoir ajouté d'autres produits.
         */
        const draft =
            this.getDraft();


        if (draft) {

            /*
             * Restaure les informations déjà saisies.
             */
            this.restoreDraft(
                draft
            );


            /*
             * Fusionne les nouveaux IDs confirmés
             * avec les produits déjà présents.
             */
            this.mergeSelectedProductIds(
                productIds
            );

        }
        else {

            /*
             * Première ouverture du formulaire.
             */
            this.initializeSelectedProducts(
                productIds
            );
        }


        /*
         * Récupère les produits sélectionnés
         * pour obtenir leurs noms, images, stocks...
         */
        this.loadSelectedProducts(
            productIds
        );


        /*
         * Charge également les produits disponibles.
         */
        this.loadProducts();
    }


    // =========================================================
    // RÉCUPÉRER LES IDS DEPUIS L'URL
    // =========================================================

    private getProductIdsFromQueryParams(): number[] {

        return this.route.snapshot.queryParamMap
            .getAll('productIds')
            .map(value => Number(value))
            .filter(productId =>
                Number.isInteger(productId) &&
                productId > 0
            )
            .filter(
                (productId, index, array) =>
                    array.indexOf(productId) === index
            );
    }


    // =========================================================
    // INITIALISER LES PRODUITS
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
    // FUSIONNER LES PRODUITS
    // =========================================================

    private mergeSelectedProductIds(
        productIds: number[]
    ): void {

        const existingIds =
            new Set(
                this.selectedItems.map(
                    item => item.productId
                )
            );


        for (const productId of productIds) {

            /*
             * Si le produit existe déjà,
             * on conserve sa quantité.
             */
            if (existingIds.has(productId)) {
                continue;
            }


            /*
             * Nouveau produit :
             * quantité par défaut = 1.
             */
            this.selectedItems.push({

                productId,

                quantity: 1
            });

            existingIds.add(
                productId
            );
        }
    }


    // =========================================================
    // CHARGER LES PRODUITS SÉLECTIONNÉS
    // =========================================================

    private loadSelectedProducts(
        productIds: number[]
    ): void {

        if (productIds.length === 0) {

            this.loading = false;

            return;
        }


        this.loading = true;

        this.error = '';


        const requests =
            productIds.map(productId =>
                this.productService.getProduct(
                    productId
                )
            );


        forkJoin(requests).subscribe({

            next: (loadedProducts: Product[]) => {

                /*
                 * IDs qui étaient déjà présents dans le brouillon.
                 *
                 * On ne doit pas automatiquement réajouter
                 * leurs images si l'utilisateur les avait
                 * volontairement supprimées.
                 */
                const draft =
                    this.getDraft();


                const previousProductIds =
                    new Set(
                        draft?.selectedItems?.map(
                            item => item.productId
                        ) ?? []
                    );


                for (const product of loadedProducts) {

                    this.addProductToLocalList(
                        product
                    );


                    /*
                     * Pour un nouveau produit,
                     * on ajoute automatiquement son image.
                     *
                     * Lors de la première création, il n'y a
                     * évidemment aucun produit précédent.
                     */
                    if (
                        !previousProductIds.has(
                            product.id
                        )
                    ) {

                        this.addProductMainImage(
                            product
                        );
                    }
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

        if (
            !product.images ||
            product.images.length === 0
        ) {
            return;
        }


        const mainImage =
            product.images.find(
                image => image.main
            ) ??
            product.images[0];


        if (!mainImage?.imageUrl) {
            return;
        }


        const alreadyExists =
            this.images.some(
                image =>
                    image.imageUrl ===
                    mainImage.imageUrl
            );


        if (alreadyExists) {
            return;
        }


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

        if (productIds.length === 0) {
            return;
        }


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
    // AJOUTER DES PRODUITS
    // =========================================================

    addProducts(): void {

        if (this.isEditMode) {

            /*
             * On autorise également l'ajout de produits
             * en modification.
             */
        }


        /*
         * Sauvegarde le formulaire actuel avant
         * de quitter la page.
         */
        this.saveDraft();


        const productIds =
            this.selectedItems.map(
                item =>
                    item.productId
            );


        this.router.navigate(
            ['/admin/products'],
            {
                queryParams: {
                    bundleSelection: 'true',
                    productIds
                }
            }
        );
    }


    // =========================================================
    // SAUVEGARDER LE BROUILLON
    // =========================================================

    private saveDraft(): void {

        const formValue =
            this.form.getRawValue();


        const draft: BundleDraft = {

            name:
                formValue.name ?? '',

            description:
                formValue.description ?? '',

            price:
                Number(
                    formValue.price ?? 0
                ),

            active:
                formValue.active ?? true,

            selectedItems:
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
                            image.imageUrl,

                        main:
                            image.main,

                        displayOrder:
                            image.displayOrder ??
                            index
                    })
                )
        };


        sessionStorage.setItem(
            this.DRAFT_STORAGE_KEY,
            JSON.stringify(draft)
        );
    }


    // =========================================================
    // RÉCUPÉRER LE BROUILLON
    // =========================================================

    private getDraft(): BundleDraft | null {

        try {

            const raw =
                sessionStorage.getItem(
                    this.DRAFT_STORAGE_KEY
                );


            if (!raw) {
                return null;
            }


            const draft =
                JSON.parse(raw);


            if (
                !draft ||
                !Array.isArray(
                    draft.selectedItems
                )
            ) {
                return null;
            }


            return draft as BundleDraft;

        }
        catch (error) {

            console.error(
                'Erreur lecture brouillon pack :',
                error
            );

            return null;
        }
    }


    // =========================================================
    // RESTAURER LE BROUILLON
    // =========================================================

    private restoreDraft(
        draft: BundleDraft
    ): void {

        this.form.patchValue({

            name:
                draft.name ?? '',

            description:
                draft.description ?? '',

            price:
                draft.price ?? 0,

            active:
                draft.active ?? true
        });


        this.selectedItems =
            (draft.selectedItems ?? [])
                .map(item => ({

                    productId:
                        Number(
                            item.productId
                        ),

                    quantity:
                        Number(
                            item.quantity
                        ) || 1
                }))
                .filter(
                    item =>
                        Number.isInteger(
                            item.productId
                        ) &&
                        item.productId > 0
                );


        this.images =
            (draft.images ?? [])
                .map(
                    (
                        image,
                        index
                    ) => ({

                        imageUrl:
                            image.imageUrl ?? '',

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
    // SUPPRIMER LE BROUILLON
    // =========================================================

    private clearDraft(): void {

        sessionStorage.removeItem(
            this.DRAFT_STORAGE_KEY
        );
    }


    // =========================================================
    // RETOUR AUX PACKS
    // =========================================================

    cancelForm(): void {

        this.clearDraft();

        this.router.navigate(
            ['/admin/bundles']
        );
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
    // AJOUTER UNE IMAGE
    // =========================================================

    addImage(): void {

        this.images.push({

            imageUrl: '',

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


        this.images.forEach(
            (image, i) => {

                image.displayOrder =
                    i;
            }
        );


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


        if (this.form.invalid) {

            this.form.markAllAsTouched();

            this.error =
                'Veuillez remplir correctement les informations du pack.';

            return;
        }


        if (
            !this.selectedItems ||
            this.selectedItems.length === 0
        ) {

            this.error =
                'Veuillez sélectionner au moins un produit pour le pack.';

            return;
        }


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

                        this.clearDraft();

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

                    this.clearDraft();

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
