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
     * Produits disponibles pour le sélecteur manuel
     */
    products: Product[] = [];

    /**
     * Produits sélectionnés dans le pack
     */
    selectedItems: BundleFormItem[] = [];

    productToAdd: number | null = null;
    quantityToAdd = 1;

    /**
     * Images du pack
     */
    images: BundleFormImage[] = [];

    form = this.fb.group({
        name: ['', [
            Validators.required,
            Validators.maxLength(255)
        ]],

        description: [''],

        price: [0, [
            Validators.required,
            Validators.min(0)
        ]],

        active: [true]
    });

    ngOnInit(): void {

        const id = this.route.snapshot.paramMap.get('id');

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

        this.initializeSelectedProducts(productIds);

        /*
         * On charge les produits sélectionnés
         * directement par leur ID.
         */
        this.loadSelectedProducts(productIds);

        /*
         * On charge également les produits disponibles
         * pour permettre d'en ajouter manuellement.
         */
        this.loadProducts();
    }

    /**
     * =====================================================
     * INITIALISATION DES PRODUITS SÉLECTIONNÉS
     * =====================================================
     */

    private initializeSelectedProducts(productIds: number[]): void {

        const uniqueIds = [...new Set(productIds)];

        this.selectedItems = uniqueIds.map(productId => ({
            productId,
            quantity: 1
        }));
    }

    /**
     * =====================================================
     * CHARGEMENT DES PRODUITS SÉLECTIONNÉS
     * =====================================================
     *
     * On récupère chaque produit directement avec son ID.
     *
     * Exemple :
     * /api/products/161
     * /api/products/143
     * /api/products/162
     */

    private loadSelectedProducts(productIds: number[]): void {

        if (productIds.length === 0) {
            return;
        }

        this.loading = true;
        this.error = '';

        const requests = productIds.map(productId =>
            this.productService.getProduct(productId)
        );

        forkJoin(requests).subscribe({

            next: (products: Product[]) => {

                /*
                 * On ajoute les produits récupérés à la liste
                 * sans créer de doublons.
                 */
                for (const product of products) {

                    const alreadyLoaded = this.products.some(
                        existingProduct =>
                            existingProduct.id === product.id
                    );

                    if (!alreadyLoaded) {
                        this.products.push(product);
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

    /**
     * =====================================================
     * CHARGEMENT DES PRODUITS DISPONIBLES
     * =====================================================
     */

    loadProducts(): void {

        this.productService.getProducts().subscribe({

            next: (products: Product[]) => {

                const loadedProducts = products ?? [];

                /*
                 * On fusionne avec les produits déjà récupérés
                 * individuellement.
                 */
                for (const product of loadedProducts) {

                    const alreadyLoaded = this.products.some(
                        existingProduct =>
                            existingProduct.id === product.id
                    );

                    if (!alreadyLoaded) {
                        this.products.push(product);
                    }
                }
            },

            error: (error) => {

                console.error(
                    'Erreur chargement produits :',
                    error
                );

                /*
                 * Ne pas écraser une éventuelle erreur
                 * de chargement des produits sélectionnés.
                 */
                if (!this.error) {
                    this.error =
                        'Impossible de charger les produits.';
                }
            }
        });
    }

    /**
     * =====================================================
     * CHARGEMENT DU PACK EN MODE MODIFICATION
     * =====================================================
     */

    loadBundle(id: number): void {

        this.loading = true;

        this.bundleService.getAdminBundle(id).subscribe({

            next: (bundle: any) => {

                this.fillForm(bundle);

                /*
                 * En modification, on récupère également
                 * les produits du pack par leur ID au cas où
                 * ils ne seraient pas présents dans la liste.
                 */
                const productIds = this.selectedItems.map(
                    item => item.productId
                );

                this.loadSelectedProductsForEdit(productIds);

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

    /**
     * =====================================================
     * CHARGEMENT PRODUITS DU PACK EN MODIFICATION
     * =====================================================
     */

    private loadSelectedProductsForEdit(
        productIds: number[]
    ): void {

        const missingIds = productIds.filter(productId =>
            !this.products.some(
                product => product.id === productId
            )
        );

        if (missingIds.length === 0) {
            return;
        }

        const requests = missingIds.map(productId =>
            this.productService.getProduct(productId)
        );

        forkJoin(requests).subscribe({

            next: (products: Product[]) => {

                for (const product of products) {

                    const alreadyLoaded = this.products.some(
                        existingProduct =>
                            existingProduct.id === product.id
                    );

                    if (!alreadyLoaded) {
                        this.products.push(product);
                    }
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

    /**
     * =====================================================
     * REMPLISSAGE DU FORMULAIRE
     * =====================================================
     */

    fillForm(bundle: any): void {

        this.form.patchValue({

            name: bundle.name ?? '',

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
                .filter((item: BundleFormItem) =>
                    Number.isInteger(item.productId) &&
                    item.productId > 0
                );

        this.images =
            (bundle.images ?? [])
                .map((image: any, index: number) => ({

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
                }));
    }

    /**
     * =====================================================
     * AJOUT D'UN PRODUIT
     * =====================================================
     */

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
                    item.productId === this.productToAdd
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

            productId: this.productToAdd,

            quantity:
                Math.floor(this.quantityToAdd)
        });

        this.productToAdd = null;
        this.quantityToAdd = 1;

        this.error = '';
    }

    /**
     * =====================================================
     * SUPPRESSION D'UN PRODUIT
     * =====================================================
     */

    removeProduct(index: number): void {

        this.selectedItems.splice(index, 1);
    }

    /**
     * =====================================================
     * MODIFICATION QUANTITÉ
     * =====================================================
     */

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

        this.selectedItems[index].quantity = quantity;
    }

    /**
     * =====================================================
     * RÉCUPÉRER UN PRODUIT
     * =====================================================
     */

    getProduct(
        productId: number
    ): Product | undefined {

        return this.products.find(
            product =>
                product.id === productId
        );
    }

    /**
     * =====================================================
     * NOM DU PRODUIT
     * =====================================================
     */

    getProductName(productId: number): string {

        const product =
            this.getProduct(productId);

        if (product) {
            return product.name;
        }

        return `Produit #${productId}`;
    }

    /**
     * =====================================================
     * IMAGE PRINCIPALE
     * =====================================================
     */

    getMainImage(productId: number): string {

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

    /**
     * =====================================================
     * STOCK
     * =====================================================
     */

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

    /**
     * =====================================================
     * AJOUT IMAGE
     * =====================================================
     */

    addImage(): void {

        this.images.push({

            imageUrl: '',

            main:
                this.images.length === 0,

            displayOrder:
                this.images.length
        });
    }

    /**
     * =====================================================
     * SUPPRESSION IMAGE
     * =====================================================
     */

    removeImage(index: number): void {

        this.images.splice(index, 1);

        this.images.forEach((image, i) => {
            image.displayOrder = i;
        });

        if (
            this.images.length > 0 &&
            !this.images.some(
                image => image.main
            )
        ) {
            this.images[0].main = true;
        }
    }

    /**
     * =====================================================
     * MODIFICATION URL IMAGE
     * =====================================================
     */

    updateImageUrl(
        index: number,
        value: string
    ): void {

        if (!this.images[index]) {
            return;
        }

        this.images[index].imageUrl = value;
    }

    /**
     * =====================================================
     * IMAGE PRINCIPALE
     * =====================================================
     */

    setMainImage(index: number): void {

        this.images.forEach((image, i) => {

            image.main =
                i === index;
        });
    }

    /**
     * =====================================================
     * ENREGISTREMENT
     * =====================================================
     */

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
                    !Number.isInteger(item.quantity) ||
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
                Number(formValue.price ?? 0),

            active:
                formValue.active ?? true,

            items:
                this.selectedItems.map(item => ({

                    productId:
                        item.productId,

                    quantity:
                        item.quantity
                })),

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

        this.saving = true;

        /**
         * =================================================
         * MODIFICATION
         * =================================================
         */

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

        /**
         * =================================================
         * CRÉATION
         * =================================================
         */

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
