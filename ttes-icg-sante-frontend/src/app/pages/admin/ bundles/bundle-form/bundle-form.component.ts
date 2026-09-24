import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
    FormBuilder, FormsModule,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';

import {
    ActivatedRoute,
    Router,
    RouterLink
} from '@angular/router';

import { BundleService } from '../../../../core/services/bundle.service';

import { ProductService } from '../../../../core/services/product.service';

import { Product } from '../../../../core/models/product.model';

import { BundleResponse } from '../../../../core/interfaces/bundle-response.interface';

import { BundleRequest } from '../../../../core/interfaces/bundle-request.interface';


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


    isEditMode = false;

    bundleId: number | null = null;

    loading = false;

    saving = false;

    error = '';

    success = '';


    products: Product[] = [];

    selectedItems: BundleFormItem[] = [];

    images: BundleFormImage[] = [];


    productToAdd: number | null = null;

    quantityToAdd = 1;


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


    ngOnInit(): void {

        this.loadProducts();

        const id =
            this.route.snapshot.paramMap.get('id');

        if (id) {

            this.isEditMode = true;

            this.bundleId = Number(id);

            this.loadBundle(this.bundleId);
        }
    }


    loadProducts(): void {

        this.productService
            .getProducts()
            .subscribe({

                next: (products) => {

                    this.products = products;
                },

                error: (error) => {

                    console.error(
                        'Erreur chargement produits :',
                        error
                    );

                    this.error =
                        'Impossible de charger les produits.';
                }

            });
    }


    loadBundle(id: number): void {

        this.loading = true;

        this.bundleService
            .getAdminBundle(id)
            .subscribe({

                next: (bundle) => {

                    this.fillForm(bundle);

                    this.loading = false;
                },

                error: (error) => {

                    console.error(
                        'Erreur chargement pack :',
                        error
                    );

                    this.error =
                        error?.error?.message ??
                        'Impossible de charger le pack.';

                    this.loading = false;
                }

            });
    }


    fillForm(bundle: BundleResponse): void {

        this.form.patchValue({

            name: bundle.name,

            description:
                bundle.description ?? '',

            price: bundle.price,

            active: bundle.active

        });


        this.selectedItems =
            bundle.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity
            }));


        this.images =
            bundle.images
                .map(image => ({
                    imageUrl: image.imageUrl,
                    main: image.main,
                    displayOrder: image.displayOrder
                }));
    }


    addProduct(): void {

        if (
            !this.productToAdd ||
            this.quantityToAdd <= 0
        ) {
            return;
        }


        const alreadyExists =
            this.selectedItems.some(
                item =>
                    item.productId === this.productToAdd
            );


        if (alreadyExists) {

            alert(
                'Ce produit est déjà présent dans le pack.'
            );

            return;
        }


        this.selectedItems.push({

            productId: this.productToAdd,

            quantity: this.quantityToAdd

        });


        this.productToAdd = null;

        this.quantityToAdd = 1;
    }


    removeProduct(productId: number): void {

        this.selectedItems =
            this.selectedItems.filter(
                item =>
                    item.productId !== productId
            );
    }


    updateProductQuantity(
        productId: number,
        event: Event
    ): void {

        const input =
            event.target as HTMLInputElement;

        const quantity =
            Number(input.value);


        if (quantity <= 0) {
            return;
        }


        const item =
            this.selectedItems.find(
                current =>
                    current.productId === productId
            );


        if (item) {
            item.quantity = quantity;
        }
    }


    getProduct(productId: number): Product | undefined {

        return this.products.find(
            product =>
                product.id === productId
        );
    }


    getProductName(productId: number): string {

        return (
            this.getProduct(productId)?.name ??
            `Produit #${productId}`
        );
    }


    getProductStock(productId: number): number {

        return (
            this.getProduct(productId)?.stock ??
            0
        );
    }


    addImage(): void {

        this.images.push({

            imageUrl: '',

            main: this.images.length === 0,

            displayOrder: this.images.length

        });
    }


    removeImage(index: number): void {

        const wasMain =
            this.images[index]?.main;

        this.images.splice(index, 1);


        this.images.forEach(
            (image, currentIndex) => {
                image.displayOrder = currentIndex;
            }
        );


        if (
            wasMain &&
            this.images.length > 0
        ) {
            this.images[0].main = true;
        }
    }


    setMainImage(index: number): void {

        this.images.forEach(
            (image, currentIndex) => {
                image.main =
                    currentIndex === index;
            }
        );
    }


    updateImageUrl(
        index: number,
        event: Event
    ): void {

        const input =
            event.target as HTMLInputElement;

        if (this.images[index]) {

            this.images[index].imageUrl =
                input.value;
        }
    }


    save(): void {

        this.error = '';

        this.success = '';


        if (this.form.invalid) {

            this.form.markAllAsTouched();

            return;
        }


        if (this.selectedItems.length === 0) {

            this.error =
                'Un pack doit contenir au moins un produit.';

            return;
        }


        const invalidQuantity =
            this.selectedItems.some(
                item =>
                    item.quantity <= 0
            );


        if (invalidQuantity) {

            this.error =
                'Toutes les quantités doivent être supérieures à zéro.';

            return;
        }


        const invalidImage =
            this.images.some(
                image =>
                    !image.imageUrl.trim()
            );


        if (invalidImage) {

            this.error =
                'Toutes les images doivent avoir une URL.';

            return;
        }


        const request: BundleRequest = {

            name:
                this.form.value.name!.trim(),

            description:
                this.form.value.description?.trim() || '',

            price:
                Number(this.form.value.price),

            active:
                this.form.value.active ?? true,

            items:
                this.selectedItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                })),

            images:
                this.images.map(
                    (image, index) => ({
                        imageUrl:
                            image.imageUrl.trim(),

                        main:
                        image.main,

                        displayOrder:
                        index
                    })
                )

        };


        this.saving = true;


        const request$ =
            this.isEditMode && this.bundleId
                ? this.bundleService.updateBundle(
                    this.bundleId,
                    request
                )
                : this.bundleService.createBundle(
                    request
                );


        request$.subscribe({

            next: (bundle) => {

                this.saving = false;

                this.success =
                    this.isEditMode
                        ? 'Pack modifié avec succès.'
                        : 'Pack créé avec succès.';


                setTimeout(() => {

                    this.router.navigate([
                        '/admin/bundles'
                    ]);

                }, 700);
            },

            error: (error) => {

                console.error(
                    'Erreur sauvegarde pack :',
                    error
                );

                this.saving = false;

                this.error =
                    error?.error?.message ??
                    'Impossible de sauvegarder le pack.';
            }

        });
    }
}