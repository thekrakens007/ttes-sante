import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
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
}


interface BundleDraft {
    name: string;
    description: string;
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

    private bundleService = inject(BundleService);
    private productService = inject(ProductService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    readonly DRAFT_STORAGE_KEY = 'ttes_bundle_draft';

    bundleId: number | null = null;
    isEditMode = false;

    loading = false;
    saving = false;

    errorMessage = '';
    successMessage = '';

    name = '';
    description = '';

    discountPercentage = 0;
    active = true;

    items: BundleFormItem[] = [];
    images: BundleFormImage[] = [];

    private initialProductIds: number[] = [];


    ngOnInit(): void {

        this.route.paramMap.subscribe(params => {

            const id = params.get('id');

            if (id) {

                this.bundleId = Number(id);
                this.isEditMode = true;

                this.loadBundleForEdit();

            } else {

                this.bundleId = null;
                this.isEditMode = false;

                this.initializeCreateMode();
            }

        });
    }


    /**
     * Initialise la création d'un nouveau pack.
     */
    private initializeCreateMode(): void {

        const draft = this.loadDraft();

        if (draft) {

            this.name = draft.name ?? '';
            this.description = draft.description ?? '';

            this.discountPercentage =
                Number(draft.discountPercentage ?? 0);

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

            this.initialProductIds =
                this.items.map(item => item.productId);

            return;
        }


        this.route.queryParams.subscribe(params => {

            const productIds =
                this.parseProductIds(params['productIds']);

            if (productIds.length === 0) {
                return;
            }

            this.initialProductIds = [...productIds];

            this.loadSelectedProducts(
                productIds,
                productIds
            );

        });
    }


    /**
     * Charge un pack existant.
     */
    private loadBundleForEdit(): void {

        if (this.bundleId === null) {
            return;
        }

        this.loading = true;
        this.errorMessage = '';

        this.bundleService
            .getAdminBundle(this.bundleId)
            .subscribe({

                next: (bundle: BundleResponse) => {

                    this.fillForm(bundle);

                    this.initialProductIds =
                        this.items.map(item => item.productId);

                    this.loading = false;
                },

                error: (error) => {

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


    /**
     * Remplit le formulaire depuis le backend.
     */
    private fillForm(bundle: BundleResponse): void {

        this.name = bundle.name ?? '';

        this.description =
            bundle.description ?? '';

        this.discountPercentage =
            Number(
                (bundle as any).discountPercentage ?? 0
            );

        this.active =
            (bundle as any).active ?? true;


        this.items =
            ((bundle as any).items ?? []).map(
                (item: any): BundleFormItem => {

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
                            Number(item.quantity ?? 1),
                        stock:
                            Number(product.stock ?? 0),
                        imageUrl
                    };
                }
            );


        this.images =
            ((bundle as any).images ?? []).map(
                (image: any, index: number) => ({
                    imageUrl:
                        image.imageUrl ??
                        image.url ??
                        '',
                    displayOrder:
                        Number(
                            image.displayOrder ??
                            index
                        )
                })
            );


        /*
         * Si le backend ne renvoie aucune image
         * mais que les produits en possèdent,
         * on ajoute automatiquement les images principales.
         */
        if (this.images.length === 0) {

            for (const item of this.items) {

                if (item.imageUrl) {

                    this.addImageIfNotExists(
                        item.imageUrl
                    );
                }
            }
        }
    }


    /**
     * Parse les IDs provenant des query params.
     */
    private parseProductIds(
        value: any
    ): number[] {

        if (value === null || value === undefined) {
            return [];
        }

        const values =
            Array.isArray(value)
                ? value
                : [value];

        const ids: number[] = [];

        for (const valueItem of values) {

            const parts =
                String(valueItem)
                    .split(',');

            for (const part of parts) {

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


    /**
     * Charge les produits sélectionnés.
     *
     * idsToAddImages = produits pour lesquels
     * on doit automatiquement ajouter l'image principale.
     */
    private loadSelectedProducts(
        productIds: number[],
        idsToAddImages: number[] = []
    ): void {

        const uniqueIds =
            [...new Set(productIds)];

        if (uniqueIds.length === 0) {
            return;
        }

        this.loading = true;

        let completed = 0;

        const idsWithImages =
            new Set(idsToAddImages);


        for (const productId of uniqueIds) {

            /*
             * Ne recharge pas inutilement un produit
             * déjà présent dans le formulaire.
             */
            const existing =
                this.items.find(
                    item =>
                        item.productId === productId
                );

            if (existing) {

                completed++;

                if (
                    completed === uniqueIds.length
                ) {
                    this.loading = false;
                }

                continue;
            }


            this.productService
                .getProduct(productId)
                .subscribe({

                    next: (product: Product) => {

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
                                    product.stock ?? 0
                                ),

                            imageUrl
                        });


                        /*
                         * Pour les nouveaux produits,
                         * l'image principale est ajoutée
                         * automatiquement.
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


                        completed++;

                        if (
                            completed === uniqueIds.length
                        ) {
                            this.loading = false;
                        }
                    },

                    error: (error) => {

                        console.error(
                            `Erreur chargement produit ${productId}:`,
                            error
                        );

                        completed++;

                        if (
                            completed === uniqueIds.length
                        ) {
                            this.loading = false;
                        }
                    }
                });
        }
    }


    /**
     * Ajout d'un produit principal dans les images.
     */
    private addImageIfNotExists(
        imageUrl: string
    ): void {

        if (!imageUrl) {
            return;
        }

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
                this.images.length
        });
    }


    /**
     * Retourne l'image principale d'un produit.
     */
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
                (image: ProductImage | any) =>
                    image.main === true
            );

        return (
            mainImage?.imageUrl ??
            images[0]?.imageUrl ??
            ''
        );
    }


    /**
     * Compatibilité avec l'ancien HTML.
     *
     * Certains anciens boutons utilisent encore
     * addProducts().
     */
    addProducts(): void {
        this.goToProductSelection();
    }


    /**
     * Ouvre la liste des produits en mode sélection.
     */
    goToProductSelection(): void {

        /*
         * Sauvegarde impérativement le formulaire
         * avant de quitter la page.
         */
        this.saveDraft();


        const productIds =
            this.items.map(
                item => item.productId
            );


        if (this.isEditMode && this.bundleId !== null) {

            this.router.navigate(
                ['/admin/products'],
                {
                    queryParams: {
                        bundleSelection: true,
                        returnMode: 'edit',
                        bundleId: this.bundleId,
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
                    bundleSelection: true,
                    returnMode: 'new',
                    productIds:
                        productIds.join(',')
                }
            }
        );
    }


    /**
     * Sauvegarde temporairement le formulaire.
     */
    private saveDraft(): void {

        const draft: BundleDraft = {

            name: this.name,

            description:
                this.description,

            discountPercentage:
                Number(
                    this.discountPercentage ?? 0
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
                                item.quantity ?? 1
                            ),

                        stock:
                            Number(
                                item.stock ?? 0
                            ),

                        imageUrl:
                            item.imageUrl ?? ''
                    })
                ),

            images:
                this.images.map(
                    (image, index) => ({
                        imageUrl:
                            image.imageUrl,

                        displayOrder:
                            Number(
                                image.displayOrder ??
                                index
                            )
                    })
                )
        };


        sessionStorage.setItem(
            this.DRAFT_STORAGE_KEY,
            JSON.stringify(draft)
        );
    }


    /**
     * Récupère le brouillon.
     */
    private loadDraft(): BundleDraft | null {

        try {

            const raw =
                sessionStorage.getItem(
                    this.DRAFT_STORAGE_KEY
                );

            if (!raw) {
                return null;
            }

            return JSON.parse(raw);

        } catch (error) {

            console.error(
                'Erreur lecture brouillon :',
                error
            );

            return null;
        }
    }


    /**
     * Supprime le brouillon.
     */
    private clearDraft(): void {

        sessionStorage.removeItem(
            this.DRAFT_STORAGE_KEY
        );
    }


    /**
     * Récupère les IDs actuellement dans le formulaire.
     */
    get selectedProductIds(): number[] {

        return this.items.map(
            item => item.productId
        );
    }


    /**
     * Nombre de produits du pack.
     */
    get productCount(): number {

        return this.items.length;
    }


    /**
     * Modifie la quantité d'un produit.
     */
    updateQuantity(
        item: BundleFormItem
    ): void {

        let quantity =
            Number(item.quantity);

        if (
            !Number.isFinite(quantity) ||
            quantity < 1
        ) {
            quantity = 1;
        }

        item.quantity =
            Math.floor(quantity);
    }


    /**
     * Supprime un produit du pack.
     */
    removeProduct(
        productId: number
    ): void {

        this.items =
            this.items.filter(
                item =>
                    item.productId !== productId
            );
    }


    /**
     * Ajoute une image manuellement.
     */
    addImage(
        imageUrl: string
    ): void {

        const url =
            imageUrl?.trim();

        if (!url) {
            return;
        }

        this.addImageIfNotExists(url);
    }


    /**
     * Supprime une image.
     */
    removeImage(
        index: number
    ): void {

        if (
            index < 0 ||
            index >= this.images.length
        ) {
            return;
        }

        this.images.splice(index, 1);

        this.reindexImages();
    }


    /**
     * Réindexe les images.
     */
    private reindexImages(): void {

        this.images =
            this.images.map(
                (image, index) => ({
                    ...image,
                    displayOrder: index
                })
            );
    }


    /**
     * Ajoute automatiquement l'image principale
     * d'un produit.
     */
    addProductMainImage(
        item: BundleFormItem
    ): void {

        if (!item.imageUrl) {
            return;
        }

        this.addImageIfNotExists(
            item.imageUrl
        );
    }


    /**
     * Vérifie si le formulaire peut être envoyé.
     */
    isFormValid(): boolean {

        if (!this.name.trim()) {
            return false;
        }

        if (this.items.length === 0) {
            return false;
        }

        return this.items.every(
            item =>
                item.productId > 0 &&
                item.quantity >= 1
        );
    }


    /**
     * Construit la requête backend.
     *
     * Adapte ici uniquement les noms si ton
     * BundleRequest possède une structure différente.
     */
    private buildRequest(): BundleRequest {

        return {

            name:
                this.name.trim(),

            description:
                this.description?.trim() ?? '',

            discountPercentage:
                Number(
                    this.discountPercentage ?? 0
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
                this.images.map(
                    (image, index) => ({
                        imageUrl:
                            image.imageUrl,

                        displayOrder:
                            Number(
                                image.displayOrder ??
                                index
                            )
                    })
                )
        } as BundleRequest;
    }


    /**
     * Enregistre le pack.
     *
     * CREATE => POST
     * EDIT   => PUT /:id
     */
    save(): void {

        if (!this.isFormValid()) {

            this.errorMessage =
                'Veuillez renseigner le nom du pack et ajouter au moins un produit.';

            return;
        }


        this.saving = true;
        this.errorMessage = '';
        this.successMessage = '';


        const request =
            this.buildRequest();


        /*
         * IMPORTANT :
         * modification d'un pack existant.
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

                        this.saving = false;

                        this.clearDraft();

                        this.successMessage =
                            'Pack modifié avec succès.';

                        this.router.navigate(
                            ['/admin/bundles']
                        );
                    },

                    error: (error) => {

                        console.error(
                            'Erreur modification pack :',
                            error
                        );

                        this.saving = false;

                        this.errorMessage =
                            'Impossible de modifier le pack.';
                    }
                });

            return;
        }


        /*
         * Création d'un nouveau pack.
         */
        this.bundleService
            .createBundle(request)
            .subscribe({

                next: () => {

                    this.saving = false;

                    this.clearDraft();

                    this.successMessage =
                        'Pack créé avec succès.';

                    this.router.navigate(
                        ['/admin/bundles']
                    );
                },

                error: (error) => {

                    console.error(
                        'Erreur création pack :',
                        error
                    );

                    this.saving = false;

                    this.errorMessage =
                        'Impossible de créer le pack.';
                }
            });
    }


    /**
     * Annule le formulaire.
     */
    cancelForm(): void {

        this.clearDraft();

        this.router.navigate(
            ['/admin/bundles']
        );
    }


    /**
     * Vérifie si un produit est dans le pack.
     */
    hasProduct(
        productId: number
    ): boolean {

        return this.items.some(
            item =>
                item.productId === productId
        );
    }


    /**
     * Titre de la page.
     */
    get pageTitle(): string {

        return this.isEditMode
            ? 'Modifier le pack'
            : 'Créer un pack';
    }


    /**
     * Texte du bouton de sauvegarde.
     */
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
}
