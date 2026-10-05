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
    ReactiveFormsModule
} from '@angular/forms';

import {
    ActivatedRoute,
    Router
} from '@angular/router';

import { BundleService } from '../../../../core/services/bundle.service';
import { ProductService } from '../../../../core/services/product.service';

import {
    BundleRequest
} from '../../../../core/interfaces/bundle-request.interface';

import {
    BundleResponse
} from '../../../../core/interfaces/bundle-response.interface';

import {
    Product,
    ProductImage
} from '../../../../core/models/product.model';


interface BundleFormItem {
    productId: number;
    productName: string;
    quantity: number;
    stock: number;
    imageUrl: string;
}


interface BundleFormImage {
    imageUrl: string;
    displayOrder: number;
    main: boolean;
}


interface BundleDraft {
    name: string;
    description: string;
    price: number;
    discountPercentage: number;
    active: boolean;
    items: BundleFormItem[];
    images: BundleFormImage[];
}


@Component({
    selector: 'app-bundle-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule
    ],
    templateUrl: './bundle-form.component.html'
})
export class BundleFormComponent implements OnInit {

    private bundleService =
        inject(BundleService);

    private productService =
        inject(ProductService);

    private route =
        inject(ActivatedRoute);

    private router =
        inject(Router);


    readonly DRAFT_STORAGE_KEY =
        'ttes_bundle_draft';


    /* =========================================================
       MODE
       ========================================================= */

    bundleId: number | null = null;

    isEditMode = false;


    /* =========================================================
       ETAT
       ========================================================= */

    loading = false;

    saving = false;

    errorMessage = '';

    successMessage = '';


    /* =========================================================
       INFORMATIONS DU PACK
       ========================================================= */

    name = '';

    description = '';

    price = 0;

    discountPercentage = 0;

    active = true;


    /* =========================================================
       PRODUITS
       ========================================================= */

    items: BundleFormItem[] = [];


    /* =========================================================
       IMAGES
       ========================================================= */

    images: BundleFormImage[] = [];


    /* =========================================================
       SELECTION INITIALE
       ========================================================= */

    initialProductIds: number[] = [];


    /* =========================================================
       LIFECYCLE
       ========================================================= */

    ngOnInit(): void {

        this.route.paramMap.subscribe(
            params => {

                const id =
                    params.get('id');

                if (id) {

                    this.bundleId =
                        Number(id);

                    this.isEditMode = true;

                    this.loadBundleForEdit();

                } else {

                    this.bundleId = null;

                    this.isEditMode = false;

                    this.initializeCreateMode();
                }
            }
        );
    }


    /* =========================================================
       PRODUITS SELECTIONNES
       ========================================================= */

    get selectedItems(): BundleFormItem[] {
        return this.items;
    }


    get selectedProductIds(): number[] {

        return this.items.map(
            item => item.productId
        );
    }


    get productCount(): number {

        return this.items.length;
    }


    /* =========================================================
       TITRES
       ========================================================= */

    get pageTitle(): string {

        return this.isEditMode
            ? 'Modifier le pack'
            : 'Créer un pack';
    }


    get saveButtonLabel(): string {

        if (this.saving) {

            return this.isEditMode
                ? 'Modification...'
                : 'Création...';
        }

        return this.isEditMode
            ? 'Modifier le pack'
            : 'Créer le pack';
    }


    /* =========================================================
       CREATION
       ========================================================= */

    private initializeCreateMode(): void {

        const draft =
            this.loadDraft();


        if (draft) {

            this.name =
                draft.name ?? '';

            this.description =
                draft.description ?? '';

            this.price =
                Number(
                    draft.price ?? 0
                );

            this.discountPercentage =
                Number(
                    draft.discountPercentage ?? 0
                );

            this.active =
                draft.active ?? true;


            this.items =
                Array.isArray(draft.items)
                    ? draft.items
                    : [];


            this.images =
                Array.isArray(draft.images)
                    ? draft.images
                    : [];


            /*
             * Compatibilité avec les anciens brouillons
             * qui n'avaient pas la propriété main.
             */
            this.images =
                this.images.map(
                    (image, index) => ({
                        imageUrl:
                            image.imageUrl ?? '',

                        displayOrder:
                            Number(
                                image.displayOrder ??
                                index
                            ),

                        main:
                            image.main === true
                    })
                );


            this.initialProductIds =
                this.items.map(
                    item =>
                        item.productId
                );


            return;
        }


        this.route.queryParams.subscribe(
            params => {

                const productIds =
                    this.parseProductIds(
                        params['productIds']
                    );


                if (
                    productIds.length === 0
                ) {
                    return;
                }


                this.initialProductIds =
                    [...productIds];


                this.loadSelectedProducts(
                    productIds,
                    productIds
                );
            }
        );
    }


    /* =========================================================
       MODIFICATION
       ========================================================= */

    private loadBundleForEdit(): void {

        if (
            this.bundleId === null
        ) {
            return;
        }


        this.loading = true;

        this.errorMessage = '';


        this.bundleService
            .getAdminBundle(
                this.bundleId
            )
            .subscribe({

                next: (
                    bundle: BundleResponse
                ) => {

                    this.fillForm(
                        bundle
                    );


                    this.initialProductIds =
                        this.items.map(
                            item =>
                                item.productId
                        );


                    this.loading = false;
                },


                error: error => {

                    console.error(
                        'Erreur chargement du pack :',
                        error
                    );


                    this.errorMessage =
                        'Impossible de charger le pack.';

                    this.loading = false;
                }
            });
    }


    /* =========================================================
       REMPLISSAGE DU FORMULAIRE
       ========================================================= */

    private fillForm(
        bundle: BundleResponse
    ): void {

        const data: any =
            bundle as any;


        this.name =
            data.name ?? '';


        this.description =
            data.description ?? '';


        this.price =
            Number(
                data.price ?? 0
            );


        this.discountPercentage =
            Number(
                data.discountPercentage ?? 0
            );


        this.active =
            data.active ?? true;


        /*
         * Produits du pack
         */
        this.items =
            (data.items ?? []).map(
                (item: any) => {

                    const product =
                        item.product ?? {};


                    const productId =
                        Number(
                            item.productId ??
                            product.id
                        );


                    const imageUrl =
                        this.getProductMainImage(
                            product
                        );


                    return {

                        productId,

                        productName:
                            item.productName ??
                            product.name ??
                            `Produit #${productId}`,

                        quantity:
                            Number(
                                item.quantity ?? 1
                            ),

                        stock:
                            Number(
                                product.stock ?? 0
                            ),

                        imageUrl
                    };
                }
            );


        /*
         * Images du pack
         */
        this.images =
            (data.images ?? []).map(
                (image: any, index: number) => ({

                    imageUrl:
                        image.imageUrl ??
                        image.url ??
                        '',

                    displayOrder:
                        Number(
                            image.displayOrder ??
                            index
                        ),

                    main:
                        image.main === true
                })
            );


        /*
         * Si aucune image de pack n'existe,
         * on récupère automatiquement les images
         * principales des produits.
         */
        if (
            this.images.length === 0
        ) {

            for (
                const item of this.items
            ) {

                if (
                    item.imageUrl
                ) {

                    this.addImageIfNotExists(
                        item.imageUrl
                    );
                }
            }
        }


        /*
         * S'il existe des images mais aucune image
         * principale, la première devient principale.
         */
        if (
            this.images.length > 0 &&
            !this.images.some(
                image => image.main
            )
        ) {

            this.images[0].main = true;
        }
    }


    /* =========================================================
       PARSE IDS
       ========================================================= */

    private parseProductIds(
        value: any
    ): number[] {

        if (
            value === null ||
            value === undefined
        ) {
            return [];
        }


        const values =
            Array.isArray(value)
                ? value
                : [value];


        const ids: number[] = [];


        for (
            const valueItem of values
        ) {

            const parts =
                String(valueItem)
                    .split(',');


            for (
                const part of parts
            ) {

                const id =
                    Number(part);


                if (
                    Number.isInteger(id) &&
                    id > 0 &&
                    !ids.includes(id)
                ) {

                    ids.push(id);
                }
            }
        }


        return ids;
    }


    /* =========================================================
       CHARGEMENT DES PRODUITS
       ========================================================= */

    private loadSelectedProducts(
        productIds: number[],
        idsToAddImages: number[] = []
    ): void {

        const uniqueIds =
            [...new Set(productIds)];


        if (
            uniqueIds.length === 0
        ) {
            return;
        }


        this.loading = true;


        const idsWithImages =
            new Set(
                idsToAddImages
            );


        let completed = 0;


        const finish =
            () => {

                completed++;


                if (
                    completed >=
                    uniqueIds.length
                ) {

                    this.loading = false;
                }
            };


        for (
            const productId of uniqueIds
        ) {

            /*
             * Produit déjà présent :
             * on ne l'écrase surtout pas.
             *
             * Cela permet de conserver :
             * - quantité modifiée
             * - images modifiées
             * - autres valeurs du formulaire
             */
            const existing =
                this.items.find(
                    item =>
                        item.productId ===
                        productId
                );


            if (existing) {

                finish();

                continue;
            }


            this.productService
                .getProduct(productId)
                .subscribe({

                    next:
                        (product: Product) => {

                            const imageUrl =
                                this.getProductMainImage(
                                    product
                                );


                            this.items.push({

                                productId:
                                    product.id,

                                productName:
                                    product.name,

                                quantity: 1,

                                stock:
                                    Number(
                                        product.stock ??
                                        0
                                    ),

                                imageUrl
                            });


                            /*
                             * Nouveau produit :
                             * ajout automatique de
                             * son image principale.
                             */
                            if (
                                idsWithImages.has(
                                    product.id
                                ) &&
                                imageUrl
                            ) {

                                this.addImageIfNotExists(
                                    imageUrl
                                );
                            }


                            finish();
                        },


                    error:
                        (error) => {

                            console.error(
                                `Erreur chargement produit ${productId}:`,
                                error
                            );

                            finish();
                        }
                });
        }
    }


    /* =========================================================
       IMAGE PRINCIPALE PRODUIT
       ========================================================= */

    private getProductMainImage(
        product: Product | any
    ): string {

        const images =
            product?.images;


        if (
            !Array.isArray(images) ||
            images.length === 0
        ) {
            return '';
        }


        const mainImage =
            images.find(
                (
                    image:
                    ProductImage | any
                ) =>
                    image.main === true
            );


        return (
            mainImage?.imageUrl ??
            images[0]?.imageUrl ??
            ''
        );
    }


    /* =========================================================
       METHODES UTILISEES PAR LE HTML
       ========================================================= */

    getMainImage(
        productId: number
    ): string {

        const item =
            this.items.find(
                item =>
                    item.productId ===
                    productId
            );


        return item?.imageUrl ?? '';
    }


    getProductName(
        productId: number
    ): string {

        const item =
            this.items.find(
                item =>
                    item.productId ===
                    productId
            );


        return (
            item?.productName ??
            `Produit #${productId}`
        );
    }


    getProductStock(
        productId: number
    ): number | null {

        const item =
            this.items.find(
                item =>
                    item.productId ===
                    productId
            );


        if (!item) {
            return null;
        }


        return item.stock;
    }


    /* =========================================================
       QUANTITE
       ========================================================= */

    updateQuantity(
        item: BundleFormItem
    ): void {

        let quantity =
            Number(
                item.quantity
            );


        if (
            !Number.isFinite(quantity) ||
            quantity < 1
        ) {

            quantity = 1;
        }


        item.quantity =
            Math.floor(quantity);
    }


    updateProductQuantity(
        productId: number,
        quantity?: number
    ): void {

        const item =
            this.items.find(
                item =>
                    item.productId ===
                    productId
            );


        if (!item) {
            return;
        }


        const newQuantity =
            Number(
                quantity ??
                item.quantity
            );


        if (
            !Number.isFinite(newQuantity) ||
            newQuantity < 1
        ) {

            item.quantity = 1;

            return;
        }


        item.quantity =
            Math.floor(
                newQuantity
            );
    }


    /* =========================================================
       PRODUITS
       ========================================================= */

    removeProduct(
        productId: number
    ): void {

        this.items =
            this.items.filter(
                item =>
                    item.productId !==
                    productId
            );
    }


    hasProduct(
        productId: number
    ): boolean {

        return this.items.some(
            item =>
                item.productId ===
                productId
        );
    }


    /* =========================================================
       AJOUT PRODUITS
       ========================================================= */

    addProducts(): void {

        this.goToProductSelection();
    }


    goToProductSelection(): void {

        /*
         * Sauvegarde avant de quitter la page.
         */
        this.saveDraft();


        const productIds =
            this.items.map(
                item =>
                    item.productId
            );


        if (
            this.isEditMode &&
            this.bundleId !== null
        ) {

            this.router.navigate(
                ['/admin/products'],
                {
                    queryParams: {

                        bundleSelection:
                            true,

                        returnMode:
                            'edit',

                        bundleId:
                            this.bundleId,

                        productIds:
                            productIds.join(',')
                    }
                }
            );


            return;
        }


        this.router.navigate(
            ['/admin/products'],
            {
                queryParams: {

                    bundleSelection:
                        true,

                    returnMode:
                        'new',

                    productIds:
                        productIds.join(',')
                }
            }
        );
    }


    /* =========================================================
       IMAGES
       ========================================================= */

    addImage(
        imageUrl?: string
    ): void {

        const url =
            imageUrl?.trim() ?? '';


        /*
         * Le HTML actuel appelle addImage()
         * sans argument pour créer une nouvelle
         * ligne d'image.
         */
        if (!url) {

            this.images.push({

                imageUrl: '',

                displayOrder:
                    this.images.length,

                main:
                    this.images.length === 0
            });


            return;
        }


        this.addImageIfNotExists(
            url
        );
    }


    private addImageIfNotExists(
        imageUrl: string
    ): void {

        if (!imageUrl) {
            return;
        }


        const exists =
            this.images.some(
                image =>
                    image.imageUrl ===
                    imageUrl
            );


        if (exists) {
            return;
        }


        this.images.push({

            imageUrl,

            displayOrder:
                this.images.length,

            main:
                this.images.length === 0
        });
    }


    addProductMainImage(
        item: BundleFormItem
    ): void {

        if (
            !item.imageUrl
        ) {
            return;
        }


        this.addImageIfNotExists(
            item.imageUrl
        );
    }


    updateImageUrl(
        index: number,
        value?: string
    ): void {

        if (
            index < 0 ||
            index >= this.images.length
        ) {
            return;
        }


        this.images[index].imageUrl =
            value?.trim() ?? '';
    }


    setMainImage(
        index: number
    ): void {

        if (
            index < 0 ||
            index >= this.images.length
        ) {
            return;
        }


        this.images =
            this.images.map(
                (
                    image,
                    currentIndex
                ) => ({

                    ...image,

                    main:
                        currentIndex ===
                        index
                })
            );
    }


    removeImage(
        index: number
    ): void {

        if (
            index < 0 ||
            index >= this.images.length
        ) {
            return;
        }


        this.images.splice(
            index,
            1
        );


        this.reindexImages();


        /*
         * Toujours avoir une image principale
         * lorsqu'il reste des images.
         */
        if (
            this.images.length > 0 &&
            !this.images.some(
                image => image.main
            )
        ) {

            this.images[0].main = true;
        }
    }


    private reindexImages(): void {

        this.images =
            this.images.map(
                (
                    image,
                    index
                ) => ({

                    ...image,

                    displayOrder:
                        index
                })
            );
    }


    /* =========================================================
       BROUILLON
       ========================================================= */

    private saveDraft(): void {

        const draft:
            BundleDraft = {

            name:
                this.name,

            description:
                this.description,

            price:
                Number(
                    this.price ?? 0
                ),

            discountPercentage:
                Number(
                    this.discountPercentage ??
                    0
                ),

            active:
                this.active,

            items:
                this.items.map(
                    item => ({

                        productId:
                            item.productId,

                        productName:
                            item.productName,

                        quantity:
                            Number(
                                item.quantity ??
                                1
                            ),

                        stock:
                            Number(
                                item.stock ??
                                0
                            ),

                        imageUrl:
                            item.imageUrl ??
                            ''
                    })
                ),

            images:
                this.images.map(
                    (
                        image,
                        index
                    ) => ({

                        imageUrl:
                            image.imageUrl,

                        displayOrder:
                            Number(
                                image.displayOrder ??
                                index
                            ),

                        main:
                            image.main === true
                    })
                )
        };


        sessionStorage.setItem(
            this.DRAFT_STORAGE_KEY,
            JSON.stringify(
                draft
            )
        );
    }


    private loadDraft():
        BundleDraft | null {

        try {

            const raw =
                sessionStorage.getItem(
                    this.DRAFT_STORAGE_KEY
                );


            if (!raw) {
                return null;
            }


            const draft =
                JSON.parse(
                    raw
                );


            return draft;

        } catch (error) {

            console.error(
                'Erreur lecture brouillon :',
                error
            );


            return null;
        }
    }


    private clearDraft(): void {

        sessionStorage.removeItem(
            this.DRAFT_STORAGE_KEY
        );
    }


    /* =========================================================
       VALIDATION
       ========================================================= */

    isFormValid(): boolean {

        if (
            !this.name.trim()
        ) {
            return false;
        }


        if (
            this.items.length === 0
        ) {
            return false;
        }


        if (
            !Number.isFinite(
                this.price
            ) ||
            this.price < 0
        ) {
            return false;
        }


        return this.items.every(
            item =>
                item.productId > 0 &&
                item.quantity >= 1
        );
    }


    /* =========================================================
       REQUEST BACKEND
       ========================================================= */

    private buildRequest():
        BundleRequest {

        return {

            name:
                this.name.trim(),

            description:
                this.description?.trim() ??
                '',

            price:
                Number(
                    this.price ?? 0
                ),

            discountPercentage:
                Number(
                    this.discountPercentage ??
                    0
                ),

            active:
                this.active,

            items:
                this.items.map(
                    item => ({

                        productId:
                            item.productId,

                        quantity:
                            Number(
                                item.quantity
                            )
                    })
                ),

            images:
                this.images
                    .filter(
                        image =>
                            !!image.imageUrl?.trim()
                    )
                    .map(
                        (
                            image,
                            index
                        ) => ({

                            imageUrl:
                                image.imageUrl.trim(),

                            displayOrder:
                                Number(
                                    image.displayOrder ??
                                    index
                                )
                        })
                    )
        };
    }


    /* =========================================================
       SAUVEGARDE
       ========================================================= */

    save(): void {

        if (
            !this.isFormValid()
        ) {

            this.errorMessage =
                'Veuillez renseigner le nom, le prix et ajouter au moins un produit.';

            return;
        }


        this.saving = true;

        this.errorMessage = '';

        this.successMessage = '';


        const request =
            this.buildRequest();


        /*
         * =====================================================
         * MODIFICATION
         * =====================================================
         *
         * PUT /api/admin/bundles/:id
         */
        if (
            this.isEditMode &&
            this.bundleId !== null
        ) {

            this.bundleService
                .updateBundle(
                    this.bundleId,
                    request
                )
                .subscribe({

                    next: () => {

                        this.saving =
                            false;


                        this.clearDraft();


                        this.successMessage =
                            'Pack modifié avec succès.';


                        this.router.navigate(
                            ['/admin/bundles']
                        );
                    },


                    error:
                        (error) => {

                            console.error(
                                'Erreur modification pack :',
                                error
                            );


                            this.saving =
                                false;


                            this.errorMessage =
                                'Impossible de modifier le pack.';
                        }
                });


            return;
        }


        /*
         * =====================================================
         * CREATION
         * =====================================================
         *
         * POST /api/admin/bundles
         */
        this.bundleService
            .createBundle(
                request
            )
            .subscribe({

                next: () => {

                    this.saving =
                        false;


                    this.clearDraft();


                    this.successMessage =
                        'Pack créé avec succès.';


                    this.router.navigate(
                        ['/admin/bundles']
                    );
                },


                error:
                    (error) => {

                        console.error(
                            'Erreur création pack :',
                            error
                        );


                        this.saving =
                            false;


                        this.errorMessage =
                            'Impossible de créer le pack.';
                    }
            });
    }


    /* =========================================================
       ANNULATION
       ========================================================= */

    cancelForm(): void {

        this.clearDraft();


        this.router.navigate(
            ['/admin/bundles']
        );
    }
}
