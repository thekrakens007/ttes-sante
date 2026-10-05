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

    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    private bundleService = inject(BundleService);
    private productService = inject(ProductService);


    form: FormGroup;


    success = '';
    error = '';

    loading = false;
    saving = false;


    bundleId: number | null = null;
    isEditMode = false;


    items: BundleFormItem[] = [];
    images: BundleFormImage[] = [];

    initialProductIds: number[] = [];


    private readonly DRAFT_KEY = 'ttes_bundle_draft';


    constructor() {

        this.form = this.fb.group({
            name: [
                '',
                [
                    Validators.required,
                    Validators.maxLength(255)
                ]
            ],

            description: [''],

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

            active: [true]
        });

    }


    ngOnInit(): void {

        /*
         * IMPORTANT :
         * On détermine le mode UNIQUEMENT avec l'ID
         * présent dans l'URL.
         *
         * /bundles/edit/23 -> EDITION
         * /bundles/new     -> CREATION
         */

        this.route.paramMap.subscribe(params => {

            const id = params.get('id');

            if (id) {

                this.bundleId = Number(id);
                this.isEditMode = true;

                this.loadBundle(this.bundleId);

                return;
            }


            this.bundleId = null;
            this.isEditMode = false;

            this.loadCreateMode();

        });

    }


    /*
     * ============================================================
     * CREATION
     * ============================================================
     */

    private loadCreateMode(): void {

        this.loading = true;

        const draft = this.getDraft();

        if (draft) {

            this.form.patchValue({
                name: draft.name,
                description: draft.description,
                price: draft.price,
                discountPercentage:
                    draft.discountPercentage,
                active: draft.active
            });

            this.items = draft.items ?? [];
            this.images = draft.images ?? [];

            this.initialProductIds =
                this.items.map(item => item.productId);

            this.loading = false;

            return;
        }


        this.route.queryParamMap.subscribe(params => {

            const productIdsParam =
                params.get('productIds');

            if (!productIdsParam) {

                this.loading = false;

                return;
            }


            const productIds =
                this.parseProductIds(productIdsParam);


            if (productIds.length === 0) {

                this.loading = false;

                return;
            }


            this.loadSelectedProducts(
                productIds,
                productIds
            );

        });

    }


    /*
     * ============================================================
     * EDITION
     * ============================================================
     */

    private loadBundle(id: number): void {

        this.loading = true;
        this.error = '';

        this.bundleService
            .getAdminBundle(id)
            .subscribe({

                next: (bundle) => {

                    this.fillForm(bundle);

                    this.loading = false;

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


    private fillForm(
        bundle: BundleResponse
    ): void {

        this.form.patchValue({
            name: bundle.name ?? '',
            description: bundle.description ?? '',
            price: bundle.price ?? 0,
            active: bundle.active ?? true
        });


        this.items = (bundle.items ?? []).map(
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
                        Number(item.quantity ?? 1),

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
                item => item.productId
            );


        this.images = (bundle.images ?? [])
            .map((image: any, index: number) => ({
                imageUrl:
                    image.imageUrl ?? '',

                displayOrder:
                    Number(
                        image.displayOrder ??
                        index
                    ),

                main:
                    image.main === true
            }));


        /*
         * Si le backend n'a pas retourné les images
         * du pack, on utilise les images principales
         * des produits.
         */

        if (this.images.length === 0) {

            this.loadImagesFromItems();

        }

    }


    /*
     * ============================================================
     * SELECTION PRODUITS
     * ============================================================
     */

    goToProductSelection(): void {

        /*
         * On sauvegarde TOUT l'état actuel :
         *
         * - nom
         * - description
         * - prix
         * - statut
         * - produits
         * - quantités
         * - images
         */

        this.saveDraft();


        const productIds =
            this.items
                .map(item => item.productId)
                .filter(id => !!id);


        /*
         * EDITION
         *
         * Il faut impérativement conserver :
         *
         * returnMode=edit
         * bundleId=23
         */

        if (
            this.isEditMode &&
            this.bundleId !== null
        ) {

            this.router.navigate(
                ['/admin/products'],
                {
                    queryParams: {
                        bundleSelection: 'true',
                        returnMode: 'edit',
                        bundleId: this.bundleId,
                        productIds:
                            productIds.join(',')
                    }
                }
            );

            return;
        }


        /*
         * CREATION
         */

        this.router.navigate(
            ['/admin/products'],
            {
                queryParams: {
                    bundleSelection: 'true',
                    returnMode: 'new',
                    productIds:
                        productIds.join(',')
                }
            }
        );

    }


    /*
     * ============================================================
     * CHARGEMENT PRODUITS
     * ============================================================
     */

    private loadSelectedProducts(
        productIds: number[],
        idsToAddImages: number[] = []
    ): void {

        if (productIds.length === 0) {

            this.loading = false;

            return;
        }


        this.loading = true;


        const existingItems =
            new Map<number, BundleFormItem>();


        /*
         * Conserver les produits existants
         * avec leurs quantités et leurs images.
         */

        this.items.forEach(item => {

            existingItems.set(
                item.productId,
                item
            );

        });


        let completed = 0;


        productIds.forEach(productId => {

            /*
             * Produit déjà présent :
             * on ne recharge PAS ses données
             * et surtout on ne modifie PAS
             * sa quantité.
             */

            if (existingItems.has(productId)) {

                completed++;

                if (
                    completed === productIds.length
                ) {
                    this.loading = false;
                }

                return;
            }


            this.productService
                .getProduct(productId)
                .subscribe({

                    next: (product) => {

                        const item: BundleFormItem = {

                            productId:
                                product.id,

                            productName:
                                product.name,

                            quantity: 1,

                            stock:
                                Number(
                                    product.stock ?? 0
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
                         * Nouveau produit :
                         * son image principale est
                         * automatiquement ajoutée.
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

                            this.items =
                                productIds
                                    .map(id =>
                                        existingItems.get(id)
                                    )
                                    .filter(
                                        (
                                            item
                                        ): item is BundleFormItem =>
                                            !!item
                                    );

                            this.loading = false;

                            this.saveDraft();

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

                            this.items =
                                productIds
                                    .map(id =>
                                        existingItems.get(id)
                                    )
                                    .filter(
                                        (
                                            item
                                        ): item is BundleFormItem =>
                                            !!item
                                    );

                            this.loading = false;

                        }

                    }

                });

        });

    }


    /*
     * ============================================================
     * PRODUITS
     * ============================================================
     */

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
                    product.productId === productId
            );


        if (!item) {
            return;
        }


        const value =
            Number(quantity);


        item.quantity =
            Number.isFinite(value) && value >= 1
                ? Math.floor(value)
                : 1;


        this.saveDraft();

    }


    removeProduct(productId: number): void {

        this.items =
            this.items.filter(
                item =>
                    item.productId !== productId
            );


        /*
         * On ne supprime pas automatiquement
         * les images existantes du pack.
         *
         * L'utilisateur peut les conserver.
         */

        this.saveDraft();

    }


    /*
     * Compatibilité
     */

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


    /*
     * ============================================================
     * IMAGES
     * ============================================================
     */

    private getProductMainImage(
        product?: Product | null
    ): string {

        if (!product?.images?.length) {
            return '';
        }


        const main =
            product.images.find(
                image => image.main === true
            );


        if (main?.imageUrl) {
            return main.imageUrl;
        }


        return product.images[0]?.imageUrl ?? '';

    }


    private addProductImage(
        product: Product
    ): void {

        const imageUrl =
            this.getProductMainImage(product);


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

        this.items.forEach(item => {

            if (!item.imageUrl) {
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

        });

    }


    addImage(): void {

        this.images.push({

            imageUrl: '',

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

        if (!this.images[index]) {
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

        if (!this.images[index]) {
            return;
        }


        const wasMain =
            this.images[index].main;


        this.images.splice(
            index,
            1
        );


        if (
            wasMain &&
            this.images.length > 0
        ) {

            this.images[0].main = true;

        }


        this.images.forEach(
            (image, i) => {

                image.displayOrder = i;

            }
        );


        this.saveDraft();

    }


    getMainImage(): string {

        const main =
            this.images.find(
                image => image.main
            );


        return main?.imageUrl ??
            this.images[0]?.imageUrl ??
            '';

    }


    /*
     * ============================================================
     * REQUEST BACKEND
     * ============================================================
     */

    private buildRequest(): BundleRequest {

        return {

            name:
                String(
                    this.form.get('name')?.value ?? ''
                ).trim(),

            description:
                String(
                    this.form.get('description')?.value ?? ''
                ).trim(),

            price:
                Number(
                    this.form.get('price')?.value ?? 0
                ),

            active:
                this.form.get('active')?.value ?? true,

            items:
                this.items.map(item => ({
                    productId:
                        item.productId,

                    quantity:
                        Number(item.quantity)
                })),

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


    /*
     * ============================================================
     * SAVE
     * ============================================================
     */

    save(): void {

        if (this.form.invalid) {

            this.form.markAllAsTouched();

            return;
        }


        if (this.items.length === 0) {

            this.error =
                'Veuillez ajouter au moins un produit au pack.';

            return;
        }


        this.saving = true;

        this.error = '';
        this.success = '';


        const request =
            this.buildRequest();


        /*
         * ========================================================
         * EDITION
         * ========================================================
         *
         * C'est ici que le doublon était créé.
         *
         * EDITION = PUT
         * CREATION = POST
         */

        if (
            this.isEditMode &&
            this.bundleId !== null
        ) {

            const id =
                this.bundleId;


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


                        setTimeout(() => {

                            this.router.navigate(
                                ['/admin/bundles']
                            );

                        }, 700);

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


        /*
         * ========================================================
         * CREATION
         * ========================================================
         */

        this.bundleService
            .createBundle(request)
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

                    }, 700);

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


    /*
     * ============================================================
     * DRAFT
     * ============================================================
     */

    private saveDraft(): void {

        const draft: BundleDraft = {

            name:
                String(
                    this.form.get('name')?.value ?? ''
                ),

            description:
                String(
                    this.form.get('description')?.value ?? ''
                ),

            price:
                Number(
                    this.form.get('price')?.value ?? 0
                ),

            discountPercentage:
                Number(
                    this.form.get(
                        'discountPercentage'
                    )?.value ?? 0
                ),

            active:
                this.form.get('active')?.value ?? true,

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


        /*
         * On stocke également le contexte d'édition.
         * Cela évite de perdre l'ID du pack.
         */

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


            /*
             * En mode création uniquement.
             *
             * Pour l'édition, le backend reste
             * la source de vérité du pack.
             */

            if (
                data.isEditMode &&
                data.bundleId
            ) {

                return {
                    name: data.name ?? '',
                    description:
                        data.description ?? '',
                    price:
                        Number(data.price ?? 0),
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

            }


            return data;

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


    private parseProductIds(
        value: string
    ): number[] {

        return value
            .split(',')
            .map(id => Number(id))
            .filter(
                id =>
                    Number.isInteger(id) &&
                    id > 0
            );

    }


    /*
     * ============================================================
     * ANNULER
     * ============================================================
     */

    cancelForm(): void {

        this.clearDraft();

        this.router.navigate(
            ['/admin/bundles']
        );

    }

}
