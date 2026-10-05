import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

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

import { BundleRequest } from '../../../../core/interfaces/bundle-request.interface';
import { BundleResponse } from '../../../../core/interfaces/bundle-response.interface';

import {
    Product
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

    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    private bundleService = inject(BundleService);
    private productService = inject(ProductService);


    // ============================================================
    // FORMULAIRE
    // ============================================================

    form: FormGroup;


    // ============================================================
    // ETAT
    // ============================================================

    success = '';
    error = '';

    loading = false;
    saving = false;


    // ============================================================
    // MODE CREATION / MODIFICATION
    // ============================================================

    bundleId: number | null = null;

    isEditMode = false;


    // ============================================================
    // PRODUITS
    // ============================================================

    items: BundleFormItem[] = [];

    initialProductIds: number[] = [];


    // ============================================================
    // IMAGES
    // ============================================================

    images: BundleFormImage[] = [];


    // ============================================================
    // DRAFT
    // ============================================================

    private readonly DRAFT_KEY =
        'ttes_bundle_draft';


    // ============================================================
    // CONSTRUCTEUR
    // ============================================================

    constructor() {

        this.form = this.fb.group({

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


    // ============================================================
    // INITIALISATION
    // ============================================================

    ngOnInit(): void {

        this.route.paramMap.subscribe(params => {

            const id =
                params.get('id');


            // ====================================================
            // MODE MODIFICATION
            // ====================================================

            if (id) {

                const numericId =
                    Number(id);


                if (
                    !Number.isInteger(numericId) ||
                    numericId <= 0
                ) {

                    this.error =
                        'Identifiant du pack invalide.';

                    return;
                }


                this.bundleId =
                    numericId;

                this.isEditMode =
                    true;


                this.route.queryParamMap.subscribe(
                    queryParams => {

                        const productIdsParam =
                            queryParams.get(
                                'productIds'
                            );


                        const productIds =
                            productIdsParam
                                ? this.parseProductIds(
                                    productIdsParam
                                )
                                : [];


                        this.loadBundle(
                            numericId,
                            productIds
                        );

                    }
                );


                return;
            }


            // ====================================================
            // MODE CREATION
            // ====================================================

            this.bundleId =
                null;

            this.isEditMode =
                false;


            this.loadCreateMode();

        });

    }


    // ============================================================
    // CREATION
    // ============================================================

    private loadCreateMode(): void {

        this.loading = true;

        this.error = '';


        this.route.queryParamMap.subscribe(
            params => {

                const productIdsParam =
                    params.get(
                        'productIds'
                    );


                const productIds =
                    productIdsParam
                        ? this.parseProductIds(
                            productIdsParam
                        )
                        : [];


                // =================================================
                // PRODUITS PRESENTS DANS L'URL
                // =================================================

                if (
                    productIds.length > 0
                ) {

                    /*
                     * Récupérer le brouillon afin de conserver :
                     *
                     * - nom
                     * - description
                     * - prix
                     * - quantités
                     * - images
                     */

                    const draft =
                        this.getDraft();


                    if (draft) {

                        this.form.patchValue({

                            name:
                                draft.name,

                            description:
                                draft.description,

                            price:
                                draft.price,

                            discountPercentage:
                                draft.discountPercentage,

                            active:
                                draft.active

                        });


                        this.items =
                            draft.items ?? [];


                        this.images =
                            draft.images ?? [];

                    }


                    const existingProductIds =
                        this.items.map(
                            item =>
                                item.productId
                        );


                    /*
                     * Produits réellement nouveaux.
                     */

                    const newProductIds =
                        productIds.filter(
                            id =>
                                !existingProductIds.includes(
                                    id
                                )
                        );


                    /*
                     * Aucun nouveau produit.
                     */

                    if (
                        newProductIds.length === 0
                    ) {

                        const itemsMap =
                            new Map<
                                number,
                                BundleFormItem
                            >(
                                this.items.map(
                                    item => [
                                        item.productId,
                                        item
                                    ]
                                )
                            );


                        this.items =
                            productIds
                                .map(
                                    id =>
                                        itemsMap.get(id)
                                )
                                .filter(
                                    (
                                        item
                                    ): item is BundleFormItem =>
                                        !!item
                                );


                        this.initialProductIds =
                            [...productIds];


                        this.loading = false;

                        this.saveDraft();

                        return;

                    }


                    /*
                     * Charger les nouveaux produits.
                     */

                    this.loadSelectedProducts(
                        productIds,
                        newProductIds
                    );

                    return;

                }


                // =================================================
                // AUCUN PRODUCT ID
                // =================================================

                const draft =
                    this.getDraft();


                if (draft) {

                    this.form.patchValue({

                        name:
                            draft.name,

                        description:
                            draft.description,

                        price:
                            draft.price,

                        discountPercentage:
                            draft.discountPercentage,

                        active:
                            draft.active

                    });


                    this.items =
                        draft.items ?? [];


                    this.images =
                        draft.images ?? [];


                    this.initialProductIds =
                        this.items.map(
                            item =>
                                item.productId
                        );

                }


                this.loading = false;

            }
        );

    }


    // ============================================================
    // MODIFICATION
    // ============================================================

    private loadBundle(
        id: number,
        selectedProductIds: number[] = []
    ): void {

        this.loading = true;

        this.error = '';


        this.bundleService
            .getAdminBundle(id)
            .subscribe({

                next: (bundle) => {

                    this.fillForm(bundle);


                    /*
                     * Aucun changement de sélection.
                     */

                    if (
                        selectedProductIds.length === 0
                    ) {

                        this.loading = false;

                        this.saveDraft();

                        return;

                    }


                    const existingProductIds =
                        this.items.map(
                            item =>
                                item.productId
                        );


                    const newProductIds =
                        selectedProductIds.filter(
                            productId =>
                                !existingProductIds.includes(
                                    productId
                                )
                        );


                    /*
                     * Aucun nouveau produit.
                     */

                    if (
                        newProductIds.length === 0
                    ) {

                        const itemsMap =
                            new Map<
                                number,
                                BundleFormItem
                            >(
                                this.items.map(
                                    item => [
                                        item.productId,
                                        item
                                    ]
                                )
                            );


                        this.items =
                            selectedProductIds
                                .map(
                                    productId =>
                                        itemsMap.get(
                                            productId
                                        )
                                )
                                .filter(
                                    (
                                        item
                                    ): item is BundleFormItem =>
                                        !!item
                                );


                        this.loading = false;

                        this.saveDraft();

                        return;

                    }


                    /*
                     * Charger uniquement les nouveaux produits.
                     */

                    this.loadSelectedProducts(
                        selectedProductIds,
                        newProductIds
                    );

                },

                error: (err) => {

                    console.error(
                        'Erreur chargement pack :',
                        err
                    );

                    this.loading = false;

                    this.error =
                        err?.error?.message ??
                        'Impossible de charger le pack.';

                }

            });

    }


    // ============================================================
    // REMPLISSAGE DU FORMULAIRE
    // ============================================================

    private fillForm(
        bundle: BundleResponse
    ): void {

        this.form.patchValue({

            name:
                bundle.name ?? '',

            description:
                bundle.description ?? '',

            price:
                bundle.price ?? 0,

            discountPercentage:
                (bundle as any).discountPercentage ?? 0,

            active:
                bundle.active ?? true

        });


        this.items =
            (bundle.items ?? []).map(
                (item: any) => {

                    const product =
                        item.product ?? item;


                    const productId =
                        Number(
                            item.productId ??
                            product?.id
                        );


                    return {

                        productId,

                        productName:
                            item.productName ??
                            product?.name ??
                            `Produit #${productId}`,

                        quantity:
                            Number(
                                item.quantity ?? 1
                            ),

                        stock:
                            Number(
                                item.stock ??
                                product?.stock ??
                                0
                            ),

                        imageUrl:
                            item.imageUrl ??
                            this.getProductMainImage(
                                product
                            )

                    };

                }
            );


        this.initialProductIds =
            this.items.map(
                item =>
                    item.productId
            );


        this.images =
            (bundle.images ?? [])
                .map(
                    (image: any, index: number) => ({

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


        /*
         * Si le pack n'a aucune image,
         * utiliser les images principales
         * des produits.
         */

        if (
            this.images.length === 0
        ) {

            this.loadImagesFromItems();

        }

    }


    // ============================================================
    // ALLER VERS LA LISTE DES PRODUITS
    // ============================================================

    goToProductSelection(): void {

        /*
         * Sauvegarder l'état actuel avant de quitter.
         */

        this.saveDraft();


        const productIds =
            this.items
                .map(
                    item =>
                        item.productId
                )
                .filter(
                    id => !!id
                );


        // ========================================================
        // MODIFICATION
        // ========================================================

        if (
            this.isEditMode &&
            this.bundleId !== null
        ) {

            this.router.navigate(
                ['/admin/products'],
                {
                    queryParams: {

                        bundleSelection:
                            'true',

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


        // ========================================================
        // CREATION
        // ========================================================

        this.router.navigate(
            ['/admin/products'],
            {
                queryParams: {

                    bundleSelection:
                        'true',

                    returnMode:
                        'new',

                    productIds:
                        productIds.join(',')

                }
            }
        );

    }


    // ============================================================
    // CHARGEMENT DES PRODUITS
    // ============================================================

    private loadSelectedProducts(
        productIds: number[],
        idsToAddImages: number[] = []
    ): void {

        if (
            productIds.length === 0
        ) {

            this.loading = false;

            return;

        }


        this.loading = true;


        /*
         * Map des produits déjà présents.
         *
         * Cela permet de conserver :
         *
         * - quantité
         * - image
         * - autres modifications
         */

        const existingItems =
            new Map<
                number,
                BundleFormItem
            >();


        this.items.forEach(
            item => {

                existingItems.set(
                    item.productId,
                    item
                );

            }
        );


        let completed = 0;


        productIds.forEach(
            productId => {

                /*
                 * Produit déjà présent.
                 */

                if (
                    existingItems.has(
                        productId
                    )
                ) {

                    completed++;


                    if (
                        completed ===
                        productIds.length
                    ) {

                        this.finishProductLoading(
                            productIds,
                            existingItems
                        );

                    }


                    return;

                }


                /*
                 * Nouveau produit.
                 */

                this.productService
                    .getProduct(productId)
                    .subscribe({

                        next: (product) => {

                            const item:
                                BundleFormItem = {

                                productId:
                                    product.id,

                                productName:
                                    product.name,

                                quantity:
                                    1,

                                stock:
                                    Number(
                                        product.stock ??
                                        0
                                    ),

                                imageUrl:
                                    this.getProductMainImage(
                                        product
                                    )

                            };


                            existingItems.set(
                                product.id,
                                item
                            );


                            /*
                             * Ajouter l'image principale
                             * du nouveau produit.
                             */

                            if (
                                idsToAddImages.includes(
                                    product.id
                                )
                            ) {

                                this.addProductImage(
                                    product
                                );

                            }


                            completed++;


                            if (
                                completed ===
                                productIds.length
                            ) {

                                this.finishProductLoading(
                                    productIds,
                                    existingItems
                                );

                            }

                        },

                        error: (err) => {

                            console.error(
                                `Erreur chargement produit ${productId}`,
                                err
                            );


                            completed++;


                            if (
                                completed ===
                                productIds.length
                            ) {

                                this.finishProductLoading(
                                    productIds,
                                    existingItems
                                );

                            }

                        }

                    });

            }
        );

    }


    // ============================================================
    // FIN CHARGEMENT PRODUITS
    // ============================================================

    private finishProductLoading(
        productIds: number[],
        existingItems: Map<
            number,
            BundleFormItem
        >
    ): void {

        this.items =
            productIds
                .map(
                    id =>
                        existingItems.get(id)
                )
                .filter(
                    (
                        item
                    ): item is BundleFormItem =>
                        !!item
                );


        /*
         * Toujours conserver le mode édition.
         */

        if (
            this.bundleId !== null
        ) {

            this.isEditMode = true;

        }


        this.initialProductIds =
            [...productIds];


        this.loading = false;


        this.saveDraft();

    }


    // ============================================================
    // PRODUITS
    // ============================================================

    get selectedItems(): BundleFormItem[] {

        return this.items;

    }


    updateProductQuantity(
        productId: number,
        quantity?: number
    ): void {

        const item =
            this.items.find(
                product =>
                    product.productId ===
                    productId
            );


        if (!item) {
            return;
        }


        const value =
            Number(quantity);


        item.quantity =
            Number.isFinite(value) &&
            value >= 1
                ? Math.floor(value)
                : 1;


        this.saveDraft();

    }


    // ============================================================
    // SUPPRESSION PRODUIT + IMAGE
    // ============================================================

    removeProduct(
        productId: number
    ): void {

        /*
         * Récupérer le produit avant suppression.
         */
        const item =
            this.items.find(
                product =>
                    product.productId === productId
            );


        if (!item) {
            return;
        }


        /*
         * Supprimer le produit.
         */
        this.items =
            this.items.filter(
                product =>
                    product.productId !== productId
            );


        /*
         * Supprimer l'image principale associée
         * à ce produit.
         *
         * Cela fonctionne aussi bien :
         *
         * - en création
         * - en modification
         * - après ajout d'un nouveau produit
         */
        if (item.imageUrl) {

            this.images =
                this.images.filter(
                    image =>
                        image.imageUrl !==
                        item.imageUrl
                );

        }


        /*
         * Réorganiser l'ordre des images.
         */
        this.images.forEach(
            (image, index) => {

                image.displayOrder =
                    index;

            }
        );


        /*
         * S'assurer qu'une image reste principale.
         */
        if (
            this.images.length > 0 &&
            !this.images.some(
                image =>
                    image.main === true
            )
        ) {

            this.images[0].main = true;

        }


        /*
         * Sauvegarder le nouvel état.
         */
        this.saveDraft();

    }


    // ============================================================
    // COMPATIBILITE
    // ============================================================

    addProducts(): void {

        this.goToProductSelection();

    }


    getProductName(
        productId: number
    ): string {

        const item =
            this.items.find(
                product =>
                    product.productId === productId
            );


        return item?.productName ??
            `Produit #${productId}`;

    }


    getProductStock(
        productId: number
    ): number {

        const item =
            this.items.find(
                product =>
                    product.productId === productId
            );


        return item?.stock ?? 0;

    }


    // ============================================================
    // IMAGES PRODUITS
    // ============================================================

    private getProductMainImage(
        product?: Product | null
    ): string {

        if (
            !product?.images?.length
        ) {

            return '';

        }


        const main =
            product.images.find(
                image =>
                    image.main === true
            );


        if (
            main?.imageUrl
        ) {

            return main.imageUrl;

        }


        return product.images[0]?.imageUrl ??
            '';

    }


    private addProductImage(
        product: Product
    ): void {

        const imageUrl =
            this.getProductMainImage(
                product
            );


        if (!imageUrl) {
            return;
        }


        /*
         * Ne pas ajouter deux fois
         * la même image.
         */

        const exists =
            this.images.some(
                image =>
                    image.imageUrl === imageUrl
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


    private loadImagesFromItems(): void {

        this.items.forEach(
            item => {

                if (
                    !item.imageUrl
                ) {

                    return;

                }


                const exists =
                    this.images.some(
                        image =>
                            image.imageUrl ===
                            item.imageUrl
                    );


                if (!exists) {

                    this.images.push({

                        imageUrl:
                            item.imageUrl,

                        displayOrder:
                            this.images.length,

                        main:
                            this.images.length === 0

                    });

                }

            }
        );

    }


    // ============================================================
    // GESTION DES IMAGES
    // ============================================================

    addImage(): void {

        this.images.push({

            imageUrl:
                '',

            displayOrder:
                this.images.length,

            main:
                this.images.length === 0

        });


        this.saveDraft();

    }


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


        this.saveDraft();

    }


    setMainImage(
        index: number
    ): void {

        this.images.forEach(
            (image, i) => {

                image.main =
                    i === index;

            }
        );


        this.saveDraft();

    }


    removeImage(
        index: number
    ): void {

        if (
            !this.images[index]
        ) {

            return;

        }


        const wasMain =
            this.images[index].main;


        this.images.splice(
            index,
            1
        );


        /*
         * Si l'image principale est supprimée,
         * la première image restante devient principale.
         */

        if (
            wasMain &&
            this.images.length > 0
        ) {

            this.images[0].main =
                true;

        }


        /*
         * Réorganiser les positions.
         */

        this.images.forEach(
            (image, i) => {

                image.displayOrder =
                    i;

            }
        );


        this.saveDraft();

    }


    getMainImage(): string {

        const main =
            this.images.find(
                image =>
                    image.main
            );


        return main?.imageUrl ??
            this.images[0]?.imageUrl ??
            '';

    }


    // ============================================================
    // REQUEST BACKEND
    // ============================================================

    private buildRequest(): BundleRequest {

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
                        (image, index) => ({

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


    // ============================================================
    // ENREGISTREMENT
    // ============================================================

    save(): void {

        if (
            this.form.invalid
        ) {

            this.form.markAllAsTouched();

            return;

        }


        if (
            this.items.length === 0
        ) {

            this.error =
                'Veuillez ajouter au moins un produit au pack.';

            return;

        }


        this.saving = true;

        this.error = '';
        this.success = '';


        const request =
            this.buildRequest();


        // ========================================================
        // MODIFICATION
        // ========================================================

        if (
            this.isEditMode &&
            this.bundleId !== null
        ) {

            const id =
                this.bundleId;


            console.log(
                'MODIFICATION PACK',
                {
                    id,
                    request
                }
            );


            this.bundleService
                .updateBundle(
                    id,
                    request
                )
                .subscribe({

                    next: () => {

                        this.saving = false;

                        this.clearDraft();

                        this.success =
                            'Pack modifié avec succès.';


                        setTimeout(
                            () => {

                                this.router.navigate(
                                    ['/admin/bundles']
                                );

                            },
                            700
                        );

                    },

                    error: (err) => {

                        console.error(
                            'Erreur modification pack :',
                            err
                        );

                        this.saving = false;

                        this.error =
                            err?.error?.message ??
                            'Erreur lors de la modification du pack.';

                    }

                });


            return;

        }


        // ========================================================
        // CREATION
        // ========================================================

        console.log(
            'CREATION PACK',
            {
                request
            }
        );


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


                    setTimeout(
                        () => {

                            this.router.navigate(
                                ['/admin/bundles']
                            );

                        },
                        700
                    );

                },

                error: (err) => {

                    console.error(
                        'Erreur création pack :',
                        err
                    );

                    this.saving = false;

                    this.error =
                        err?.error?.message ??
                        'Erreur lors de la création du pack.';

                }

            });

    }


    // ============================================================
    // DRAFT
    // ============================================================

    private saveDraft(): void {

        const draft: BundleDraft = {

            name:
                String(
                    this.form.get(
                        'name'
                    )?.value ?? ''
                ),

            description:
                String(
                    this.form.get(
                        'description'
                    )?.value ?? ''
                ),

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
                        ...item
                    })
                ),

            images:
                this.images.map(
                    image => ({
                        ...image
                    })
                )

        };


        const data = {

            ...draft,

            isEditMode:
                this.isEditMode,

            bundleId:
                this.bundleId

        };


        sessionStorage.setItem(
            this.DRAFT_KEY,
            JSON.stringify(data)
        );

    }


    private getDraft(): BundleDraft | null {

        try {

            const raw =
                sessionStorage.getItem(
                    this.DRAFT_KEY
                );


            if (!raw) {

                return null;

            }


            const data =
                JSON.parse(raw);


            return {

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
                    data.active ?? true,

                items:
                    data.items ?? [],

                images:
                    data.images ?? []

            };

        } catch (err) {

            console.error(
                'Erreur lecture draft :',
                err
            );

            return null;

        }

    }


    private clearDraft(): void {

        sessionStorage.removeItem(
            this.DRAFT_KEY
        );

    }


    // ============================================================
    // UTILITAIRE IDS
    // ============================================================

    private parseProductIds(
        value: string
    ): number[] {

        return value
            .split(',')
            .map(
                id =>
                    Number(id)
            )
            .filter(
                id =>
                    Number.isInteger(id) &&
                    id > 0
            );

    }


    // ============================================================
    // ANNULER
    // ============================================================

    cancelForm(): void {

        this.clearDraft();

        this.router.navigate(
            ['/admin/bundles']
        );

    }

}
