import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';

import {
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators
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
export class BundleFormComponent
    implements OnInit {

    private fb =
        inject(FormBuilder);

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


    /* =====================================================
       FORMULAIRE
       ===================================================== */

    form: FormGroup;


    /* =====================================================
       ETAT
       ===================================================== */

    loading = false;

    saving = false;


    success = '';

    error = '';


    /* =====================================================
       MODE
       ===================================================== */

    bundleId: number | null = null;

    isEditMode = false;


    /* =====================================================
       PRODUITS
       ===================================================== */

    items: BundleFormItem[] = [];


    /* =====================================================
       IMAGES
       ===================================================== */

    images: BundleFormImage[] = [];


    /* =====================================================
       SELECTION INITIALE
       ===================================================== */

    initialProductIds: number[] = [];


    constructor() {

        this.form =
            this.fb.group({

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

                discountPercentage: [
                    0,
                    [
                        Validators.min(0),
                        Validators.max(100)
                    ]
                ],

                active: [
                    true
                ]
            });
    }


    /* =====================================================
       INIT
       ===================================================== */

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


    /* =====================================================
       GETTERS COMPATIBILITE
       ===================================================== */

    get selectedItems(): BundleFormItem[] {
        return this.items;
    }


    get selectedProductIds(): number[] {

        return this.items.map(
            item =>
                item.productId
        );
    }


    get productCount(): number {

        return this.items.length;
    }


    get name(): string {

        return this.form.get('name')?.value ?? '';
    }


    get description(): string {

        return this.form.get('description')?.value ?? '';
    }


    get price(): number {

        return Number(
            this.form.get('price')?.value ?? 0
        );
    }


    get discountPercentage(): number {

        return Number(
            this.form.get(
                'discountPercentage'
            )?.value ?? 0
        );
    }


    get active(): boolean {

        return this.form.get('active')?.value ?? true;
    }


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


    /* =====================================================
       CREATION
       ===================================================== */

    private initializeCreateMode(): void {

        const draft =
            this.loadDraft();


        if (draft) {

            this.form.patchValue({

                name:
                    draft.name ?? '',

                description:
                    draft.description ?? '',

                price:
                    Number(
                        draft.price ?? 0
                    ),

                discountPercentage:
                    Number(
                        draft.discountPercentage ?? 0
                    ),

                active:
                    draft.active ?? true
            });


            this.items =
                Array.isArray(draft.items)
                    ? draft.items.map(
                        item => ({
                            productId:
                                Number(
                                    item.productId
                                ),

                            productName:
                                item.productName ?? '',

                            quantity:
                                Number(
                                    item.quantity ?? 1
                                ),

                            stock:
                                Number(
                                    item.stock ?? 0
                                ),

                            imageUrl:
                                item.imageUrl ?? ''
                        })
                    )
                    : [];


            this.images =
                Array.isArray(draft.images)
                    ? draft.images.map(
                        (
                            image,
                            index
                        ) => ({

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
                    )
                    : [];


            this.initialProductIds =
                this.items.map(
                    item =>
                        item.productId
                );


            this.ensureMainImage();

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


    /* =====================================================
       MODIFICATION
       ===================================================== */

    private loadBundleForEdit(): void {

        if (
            this.bundleId === null
        ) {
            return;
        }


        this.loading = true;

        this.error = '';


        this.bundleService
            .getAdminBundle(
                this.bundleId
            )
            .subscribe({

                next:
                    (
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


                error:
                    error => {

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


    /* =====================================================
       REMPLIR LE FORMULAIRE
       ===================================================== */

    private fillForm(
        bundle: BundleResponse
    ): void {

        const data: any =
            bundle as any;


        this.form.patchValue({

            name:
                data.name ?? '',

            description:
                data.description ?? '',

            price:
                Number(
                    data.price ?? 0
                ),

            discountPercentage:
                Number(
                    data.discountPercentage ?? 0
                ),

            active:
                data.active ?? true
        });


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

                        imageUrl:
                            this.getProductMainImage(
                                product
                            )
                    };
                }
            );


        this.images =
            (data.images ?? []).map(
                (
                    image: any,
                    index: number
                ) => ({

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
         * Si le backend n'a pas envoyé les images
         * du pack, on utilise les images principales
         * des produits.
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


        this.ensureMainImage();
    }


    /* =====================================================
       IDS
       ===================================================== */

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

            for (
                const part of
                String(valueItem).split(',')
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


    /* =====================================================
       CHARGER LES PRODUITS
       ===================================================== */

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
             * Ne jamais écraser un produit
             * déjà présent.
             *
             * Cela conserve notamment la quantité
             * modifiée par l'utilisateur.
             */
            if (
                this.items.some(
                    item =>
                        item.productId ===
                        productId
                )
            ) {

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
                             * Seulement les nouveaux produits
                             * ajoutent automatiquement leur image.
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
                        error => {

                            console.error(
                                `Erreur produit ${productId} :`,
                                error
                            );

                            finish();
                        }
                });
        }
    }


    /* =====================================================
       IMAGE PRODUIT
       ===================================================== */

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


        return item?.stock ?? null;
    }


    /* =====================================================
       QUANTITES
       ===================================================== */

    updateQuantity(
        item: BundleFormItem
    ): void {

        const quantity =
            Number(
                item.quantity
            );


        if (
            !Number.isFinite(quantity) ||
            quantity < 1
        ) {

            item.quantity = 1;

            return;
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


        const value =
            Number(
                quantity ??
                item.quantity
            );


        if (
            !Number.isFinite(value) ||
            value < 1
        ) {

            item.quantity = 1;

            return;
        }


        item.quantity =
            Math.floor(value);
    }


    /* =====================================================
       PRODUITS
       ===================================================== */

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


    /* =====================================================
       AJOUTER DES PRODUITS
       ===================================================== */

    addProducts(): void {

        this.goToProductSelection();
    }


    goToProductSelection(): void {

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


    /* =====================================================
       IMAGES
       ===================================================== */

    addImage(
        imageUrl?: string
    ): void {

        const url =
            imageUrl?.trim() ?? '';


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

        const url =
            imageUrl.trim();


        if (!url) {
            return;
        }


        const exists =
            this.images.some(
                image =>
                    image.imageUrl ===
                    url
            );


        if (exists) {
            return;
        }


        this.images.push({

            imageUrl: url,

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
            item.imageUrl
        ) {

            this.addImageIfNotExists(
                item.imageUrl
            );
        }
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

        this.ensureMainImage();
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


    private ensureMainImage(): void {

        if (
            this.images.length === 0
        ) {
            return;
        }


        if (
            !this.images.some(
                image =>
                    image.main
            )
        ) {

            this.images[0].main =
                true;
        }
    }


    /* =====================================================
       BROUILLON
       ===================================================== */

    private saveDraft(): void {

        const draft:
            BundleDraft = {

            name:
                this.form.get(
                    'name'
                )?.value ?? '',

            description:
                this.form.get(
                    'description'
                )?.value ?? '',

            price:
                Number(
                    this.form.get(
                        'price'
                    )?.value ?? 0
                ),

            discountPercentage:
                Number(
                    this.form.get(
                        'discountPercentage'
                    )?.value ?? 0
                ),

            active:
                this.form.get(
                    'active'
                )?.value ?? true,

            items:
                this.items.map(
                    item => ({

                        productId:
                            item.productId,

                        productName:
                            item.productName,

                        quantity:
                            Number(
                                item.quantity
                            ),

                        stock:
                            Number(
                                item.stock
                            ),

                        imageUrl:
                            item.imageUrl
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


            return JSON.parse(
                raw
            );

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


    /* =====================================================
       VALIDATION
       ===================================================== */

    isFormValid(): boolean {

        return (
            this.form.valid &&
            this.items.length > 0 &&
            this.items.every(
                item =>
                    item.productId > 0 &&
                    item.quantity >= 1
            )
        );
    }


    /* =====================================================
       REQUEST BACKEND
       ===================================================== */

    private buildRequest():
        BundleRequest {

        return {

            name:
                String(
                    this.form.get(
                        'name'
                    )?.value ?? ''
                ).trim(),

            description:
                String(
                    this.form.get(
                        'description'
                    )?.value ?? ''
                ).trim(),

            price:
                Number(
                    this.form.get(
                        'price'
                    )?.value ?? 0
                ),

            discountPercentage:
                Number(
                    this.form.get(
                        'discountPercentage'
                    )?.value ?? 0
                ),

            active:
                this.form.get(
                    'active'
                )?.value ?? true,

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
                                ),

                            main:
                                image.main === true
                        })
                    )
        };
    }


    /* =====================================================
       SAUVEGARDE
       ===================================================== */

    save(): void {

        this.success = '';

        this.error = '';


        if (
            this.form.invalid
        ) {

            this.form.markAllAsTouched();

            this.error =
                'Veuillez corriger les informations du formulaire.';

            return;
        }


        if (
            this.items.length === 0
        ) {

            this.error =
                'Veuillez ajouter au moins un produit au pack.';

            return;
        }


        if (
            !this.items.every(
                item =>
                    item.quantity >= 1
            )
        ) {

            this.error =
                'La quantité de chaque produit doit être supérieure ou égale à 1.';

            return;
        }


        this.saving = true;


        const request =
            this.buildRequest();


        /*
         * IMPORTANT :
         *
         * Modification = PUT /:id
         *
         * et surtout PAS POST.
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

                    next:
                        () => {

                            this.saving =
                                false;

                            this.success =
                                'Pack modifié avec succès.';

                            this.clearDraft();


                            this.router.navigate(
                                ['/admin/bundles']
                            );
                        },


                    error:
                        error => {

                            console.error(
                                'Erreur modification pack :',
                                error
                            );

                            this.saving =
                                false;

                            this.error =
                                error?.error?.message ??
                                'Impossible de modifier le pack.';
                        }
                });


            return;
        }


        /*
         * Création = POST
         */
        this.bundleService
            .createBundle(
                request
            )
            .subscribe({

                next:
                    () => {

                        this.saving =
                            false;

                        this.success =
                            'Pack créé avec succès.';

                        this.clearDraft();


                        this.router.navigate(
                            ['/admin/bundles']
                        );
                    },


                error:
                    error => {

                        console.error(
                            'Erreur création pack :',
                            error
                        );

                        this.saving =
                            false;

                        this.error =
                            error?.error?.message ??
                            'Impossible de créer le pack.';
                    }
            });
    }


    /* =====================================================
       ANNULATION
       ===================================================== */

    cancelForm(): void {

        this.clearDraft();


        this.router.navigate(
            ['/admin/bundles']
        );
    }
}
