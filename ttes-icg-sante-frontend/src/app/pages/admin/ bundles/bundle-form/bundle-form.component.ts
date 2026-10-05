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
    Router
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
    form: {
        name: string;
        description: string;
        price: number;
        active: boolean;
    };

    selectedItems: BundleFormItem[];

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
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    private bundleService = inject(BundleService);
    private productService = inject(ProductService);

    // =========================================================
    // CONSTANTES
    // =========================================================

    private readonly DRAFT_STORAGE_KEY =
        'ttes_bundle_draft';

    // =========================================================
    // MODE
    // =========================================================

    isEditMode = false;

    bundleId: number | null = null;

    loading = false;

    saving = false;

    error = '';

    success = '';

    // =========================================================
    // DONNÉES
    // =========================================================

    products: Product[] = [];

    selectedItems: BundleFormItem[] = [];

    images: BundleFormImage[] = [];

    // =========================================================
    // FORMULAIRE
    // =========================================================

    form = this.fb.group({

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

        active: [true]
    });

    // =========================================================
    // INITIALISATION
    // =========================================================

    ngOnInit(): void {

        const id =
            this.route.snapshot.paramMap.get('id');

        // =====================================================
        // MODE MODIFICATION
        // =====================================================

        if (id) {

            const parsedId = Number(id);

            if (
                !Number.isInteger(parsedId) ||
                parsedId <= 0
            ) {
                this.error =
                    'Identifiant du pack invalide.';
                return;
            }

            this.isEditMode = true;

            this.bundleId = parsedId;

            // IMPORTANT :
            // En mode modification, on ne restaure PAS
            // le brouillon de création.
            this.loadProducts();

            this.loadBundle(parsedId);

            return;
        }

        // =====================================================
        // MODE CRÉATION
        // =====================================================

        this.isEditMode = false;

        this.bundleId = null;

        const productIds =
            this.route.snapshot.queryParamMap
                .getAll('productIds')
                .map(value => Number(value))
                .filter(productId =>
                    Number.isInteger(productId) &&
                    productId > 0
                );

        const uniqueProductIds =
            [...new Set(productIds)];

        // -----------------------------------------------------
        // Tentative de restauration du brouillon
        // -----------------------------------------------------

        const draft =
            this.restoreDraft();

        if (draft) {

            // IDs qui étaient présents dans le brouillon
            const previousIds =
                draft.selectedItems
                    .map(item => item.productId);

            // Les IDs actuellement sélectionnés
            // deviennent la source de vérité.
            const draftItemsMap =
                new Map<number, BundleFormItem>();

            for (
                const item of draft.selectedItems
            ) {
                draftItemsMap.set(
                    item.productId,
                    {
                        productId: item.productId,
                        quantity: item.quantity
                    }
                );
            }

            this.selectedItems =
                uniqueProductIds.map(productId => {

                    const existing =
                        draftItemsMap.get(productId);

                    return {
                        productId,
                        quantity:
                            existing?.quantity ?? 1
                    };
                });

            this.form.patchValue({
                name: draft.form.name,
                description: draft.form.description,
                price: draft.form.price,
                active: draft.form.active
            });

            this.images =
                draft.images.map(image => ({
                    imageUrl: image.imageUrl,
                    main: image.main,
                    displayOrder: image.displayOrder
                }));

            // -------------------------------------------------
            // Seuls les NOUVEAUX produits doivent
            // automatiquement ajouter leur image principale.
            // -------------------------------------------------

            const newProductIds =
                uniqueProductIds.filter(
                    productId =>
                        !previousIds.includes(productId)
                );

            this.loadSelectedProducts(
                uniqueProductIds,
                newProductIds
            );

        } else {

            // Aucun brouillon
            this.initializeSelectedProducts(
                uniqueProductIds
            );

            this.loadSelectedProducts(
                uniqueProductIds,
                uniqueProductIds
            );
        }

        this.loadProducts();
    }

    // =========================================================
    // INITIALISATION PRODUITS
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
    // CHARGER PRODUITS SÉLECTIONNÉS
    // =========================================================

    private loadSelectedProducts(
        productIds: number[],
        idsToAddImages: number[] = productIds
    ): void {

        if (productIds.length === 0) {
            return;
        }

        this.loading = true;

        this.error = '';

        const requests =
            productIds.map(productId =>
                this.productService.getProduct(productId)
            );

        forkJoin(requests).subscribe({

            next: (
                loadedProducts: Product[]
            ) => {

                for (
                    const product of loadedProducts
                ) {

                    this.addProductToLocalList(
                        product
                    );

                    if (
                        idsToAddImages.includes(
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
    // LISTE LOCALE
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

            this.products.push(product);
        }
    }

    // =========================================================
    // IMAGE PRINCIPALE PRODUIT
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

                next: (
                    products: Product[]
                ) => {

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
    // CHARGER LE PACK
    // =========================================================

    loadBundle(id: number): void {

        this.loading = true;

        this.bundleService
            .getAdminBundle(id)
            .subscribe({

                next: (bundle: any) => {

                    this.fillForm(bundle);

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
    // PRODUITS DU PACK EN MODIFICATION
    // =========================================================

    private loadSelectedProductsForEdit(
        productIds: number[]
    ): void {

        const missingIds =
            productIds.filter(
                productId =>
                    !this.products.some(
                        product =>
                            product.id === productId
                    )
            );

        if (missingIds.length === 0) {
            return;
        }

        const requests =
            missingIds.map(
                productId =>
                    this.productService
                        .getProduct(productId)
            );

        forkJoin(requests).subscribe({

            next: (
                loadedProducts: Product[]
            ) => {

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
    // REMPLIR FORMULAIRE
    // =========================================================

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

    goToProductSelection(): void {

        // Sauvegarde du formulaire actuel
        // avant de quitter la page.
        this.saveDraft();

        const productIds =
            this.selectedItems.map(
                item => item.productId
            );

        // =====================================================
        // MODIFICATION
        // =====================================================

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

                        productIds
                    }
                }
            );

            return;
        }

        // =====================================================
        // CRÉATION
        // =====================================================

        this.router.navigate(
            ['/admin/products'],
            {
                queryParams: {

                    bundleSelection:
                        'true',

                    returnMode:
                        'new',

                    productIds
                }
            }
        );
    }

    // =========================================================
    // PRODUITS DU PACK
    // =========================================================

    removeProduct(index: number): void {

        if (
            index < 0 ||
            index >= this.selectedItems.length
        ) {
            return;
        }

        this.selectedItems.splice(
            index,
            1
        );
    }

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

        if (!this.selectedItems[index]) {
            return;
        }

        this.selectedItems[index].quantity =
            quantity;
    }

    getProduct(
        productId: number
    ): Product | undefined {

        return this.products.find(
            product =>
                product.id === productId
        );
    }

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

    // =========================================================
    // IMAGES
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

    removeImage(index: number): void {

        if (
            index < 0 ||
            index >= this.images.length
        ) {
            return;
        }

        const wasMain =
            this.images[index].main;

        this.images.splice(index, 1);

        this.images.forEach(
            (image, i) => {
                image.displayOrder = i;
            }
        );

        if (
            this.images.length > 0 &&
            (
                wasMain ||
                !this.images.some(
                    image => image.main
                )
            )
        ) {

            this.images.forEach(
                (image, i) => {
                    image.main = i === 0;
                }
            );
        }
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
    }

    setMainImage(index: number): void {

        this.images.forEach(
            (image, i) => {
                image.main = i === index;
            }
        );
    }

    // =========================================================
    // BROUILLON SESSION STORAGE
    // =========================================================

    private saveDraft(): void {

        const formValue =
            this.form.getRawValue();

        const draft: BundleDraft = {

            form: {

                name:
                    formValue.name ?? '',

                description:
                    formValue.description ?? '',

                price:
                    Number(
                        formValue.price ?? 0
                    ),

                active:
                    formValue.active ?? true
            },

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
                    image => ({
                        imageUrl:
                            image.imageUrl,
                        main:
                            image.main,
                        displayOrder:
                            image.displayOrder
                    })
                )
        };

        sessionStorage.setItem(
            this.DRAFT_STORAGE_KEY,
            JSON.stringify(draft)
        );
    }

    private restoreDraft():
        BundleDraft | null {

        const raw =
            sessionStorage.getItem(
                this.DRAFT_STORAGE_KEY
            );

        if (!raw) {
            return null;
        }

        try {

            return JSON.parse(
                raw
            ) as BundleDraft;

        } catch (error) {

            console.error(
                'Erreur lecture brouillon pack :',
                error
            );

            sessionStorage.removeItem(
                this.DRAFT_STORAGE_KEY
            );

            return null;
        }
    }

    private clearDraft(): void {

        sessionStorage.removeItem(
            this.DRAFT_STORAGE_KEY
        );
    }

    // =========================================================
    // ANNULER
    // =========================================================

    cancelForm(): void {

        this.clearDraft();

        this.router.navigate(
            ['/admin/bundles']
        );
    }

    // =========================================================
    // SAUVEGARDE
    // =========================================================

    save(): void {

        this.error = '';

        this.success = '';

        // -----------------------------------------------------
        // VALIDATION FORMULAIRE
        // -----------------------------------------------------

        if (this.form.invalid) {

            this.form.markAllAsTouched();

            this.error =
                'Veuillez remplir correctement les informations du pack.';

            return;
        }

        // -----------------------------------------------------
        // PRODUITS
        // -----------------------------------------------------

        if (
            !this.selectedItems ||
            this.selectedItems.length === 0
        ) {

            this.error =
                'Veuillez sélectionner au moins un produit pour le pack.';

            return;
        }

        // -----------------------------------------------------
        // QUANTITÉS
        // -----------------------------------------------------

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

        // -----------------------------------------------------
        // IMAGES
        // -----------------------------------------------------

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

        // -----------------------------------------------------
        // REQUEST
        // -----------------------------------------------------

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

        console.log(
            'MODE :',
            this.isEditMode
                ? 'MODIFICATION'
                : 'CRÉATION'
        );

        console.log(
            'BUNDLE ID :',
            this.bundleId
        );

        console.log(
            'REQUEST :',
            request
        );

        this.saving = true;

        // =====================================================
        // MODIFICATION
        // =====================================================

        if (
            this.isEditMode &&
            this.bundleId !== null
        ) {

            const id =
                this.bundleId;

            console.log(
                `Modification du pack #${id}`
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

        console.log(
            'Création d’un nouveau pack'
        );

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
