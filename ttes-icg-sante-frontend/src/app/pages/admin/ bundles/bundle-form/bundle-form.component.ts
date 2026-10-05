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

        /*
         * ========================================================
         * IMPORTANT
         * ========================================================
         *
         * Le mode est déterminé UNIQUEMENT par le paramètre :id
         *
         * /admin/bundles/new
         *      => création
         *
         * /admin/bundles/edit/23
         *      => modification du pack 23
         *
         * Les query params productIds ne doivent JAMAIS modifier
         * le mode création/modification.
         */

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


                /*
                 * On conserve explicitement le contexte d'édition.
                 */

                this.bundleId =
                    numericId;

                this.isEditMode =
                    true;


                /*
                 * Les produits éventuellement sélectionnés
                 * après le passage par la liste des produits.
                 */
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


        /*
         * On tente d'abord de récupérer un brouillon.
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


            this.initialProductIds =
                this.items.map(
                    item =>
                        item.productId
                );


            this.loading = false;

            return;
        }


        /*
         * Sinon, on regarde si des produits ont été
         * sélectionnés depuis la liste.
         */

        this.route.queryParamMap.subscribe(
            params => {

                const productIdsParam =
                    params.get('productIds');


                if (!productIdsParam) {

                    this.loading = false;

                    return;
                }


                const productIds =
                    this.parseProductIds(
                        productIdsParam
                    );


                if (
                    productIds.length === 0
                ) {

                    this.loading = false;

                    return;
                }


                this.loadSelectedProducts(
                    productIds,
                    productIds
                );

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

                    /*
                     * On charge d'abord le pack existant.
                     *
                     * fillForm() récupère :
                     * - nom
                     * - description
                     * - prix
                     * - statut
                     * - produits
                     * - quantités
                     * - images
                     */
                    this.fillForm(bundle);


                    /*
                     * ==================================================
                     * RETOUR DE LA SELECTION DE PRODUITS
                     * ==================================================
                     *
                     * Si aucun productIds n'est présent :
                     * le pack est simplement affiché.
                     */

                    if (
                        selectedProductIds.length === 0
                    ) {

                        this.loading = false;

                        return;
                    }


                    /*
                     * Produits actuellement présents
                     * dans le pack.
                     */

                    const existingProductIds =
                        this.items.map(
                            item =>
                                item.productId
                        );


                    /*
                     * Produits qui viennent d'être ajoutés
                     * depuis la liste.
                     */

                    const newProductIds =
                        selectedProductIds.filter(
                            productId =>
                                !existingProductIds.includes(
                                    productId
                                )
                        );


                    /*
                     * Aucun nouveau produit.
                     *
                     * Cela peut arriver si l'utilisateur ouvre
                     * la sélection puis confirme sans rien ajouter.
                     */

                    if (
                        newProductIds.length === 0
                    ) {

                        /*
                         * On conserve les objets existants
                         * et donc leurs quantités.
                         */

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
                     * Il y a de nouveaux produits.
                     *
                     * On recharge la sélection complète.
                     *
                     * loadSelectedProducts() va :
                     *
                     * - conserver les anciens produits
                     * - conserver leurs quantités
                     * - conserver leurs images
                     * - charger les nouveaux produits
                     * - donner quantité 1 aux nouveaux
                     * - ajouter leurs images principales
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

            /*
             * Si la propriété existe dans le backend/interface.
             */
            discountPercentage:
                (bundle as any).discountPercentage ?? 0,

            active:
                bundle.active ?? true

        });


        /*
         * Produits du pack.
         */

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


        /*
         * Images du pack.
         */

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
         * on utilise les images principales
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
         * Sauvegarder l'état actuel AVANT de quitter.
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
    // CHARGEMENT DES PRODUITS SELECTIONNES
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
         * Map contenant les produits déjà présents.
         *
         * Très important :
         * on conserve les objets existants pour garder
         * leurs quantités et images.
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
                 * Produit déjà présent :
                 *
                 * On ne le recharge pas.
                 * Sa quantité reste intacte.
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
                 * Nouveau produit :
                 * récupération depuis l'API.
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

                                /*
                                 * Nouveau produit =
                                 * quantité 1
                                 */
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
                             * Ajouter automatiquement
                             * l'image principale du nouveau produit.
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

        /*
         * Reconstituer les produits dans l'ordre
         * de la sélection.
         */

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


        this.loading = false;


        /*
         * Sauvegarder le nouvel état.
         */

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


    removeProduct(
        productId: number
    ): void {

        this.items =
            this.items.filter(
                item =>
                    item.productId !==
                    productId
            );


        /*
         * Les images ne sont pas supprimées
         * automatiquement.
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
                    product.productId ===
                    productId
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
                    product.productId ===
                    productId
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
         * Si on supprime l'image principale,
         * la première restante devient principale.
         */

        if (
            wasMain &&
            this.images.length > 0
        ) {

            this.images[0].main =
                true;

        }


        /*
         * Réorganiser displayOrder.
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

        /*
         * Validation formulaire.
         */

        if (
            this.form.invalid
        ) {

            this.form.markAllAsTouched();

            return;

        }


        /*
         * Il faut au moins un produit.
         */

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


        /*
         * On conserve également le contexte.
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
             * Un brouillon d'édition ne doit jamais être utilisé
             * pour transformer une création en modification.
             *
             * Le mode est toujours déterminé par l'URL.
             */

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
