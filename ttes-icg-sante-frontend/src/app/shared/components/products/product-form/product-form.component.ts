import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder, FormsModule,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';

import { AdminService } from '../../../../core/services/admin.service';

import { CompanyResponse } from '../../../../core/interfaces/company-response.interface';
import { CategoryResponse } from '../../../../core/interfaces/category-response.interface';
import { TherapeuticAreaResponse } from '../../../../core/interfaces/therapeutic-area-response.interface';
import { ProductRequest } from '../../../../core/interfaces/product-request.interface';
import {ActivatedRoute, Router} from "@angular/router";
import {ProductResponse} from "../../../../core/interfaces/product-response.interface";
import {ProductImageResponse} from "../../../../core/interfaces/product-image-response.interface";

@Component({
    selector: 'app-product-form',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule
    ],
    templateUrl: './product-form.component.html'
})
export class ProductFormComponent implements OnInit {

    private fb = inject(FormBuilder);
    private adminService = inject(AdminService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    companies: CompanyResponse[] = [];
    categories: CategoryResponse[] = [];
    therapeuticAreas: TherapeuticAreaResponse[] = [];

    images: ProductImageResponse[] = [];

    newImageUrl = '';

    newImageMain = false;

    newImageDisplayOrder = 0;

    imageLoading = false;

    imageError = '';

    isEditMode = false;

    productId!: number;

    loading = false;
    successMessage = '';
    errorMessage = '';

    productForm = this.fb.group({
        companyId: [null as number | null, Validators.required],

        name: ['', Validators.required],

        sku: ['', Validators.required],

        description: [''],

        brand: [''],

        activeIngredient: [''],

        dosage: [''],

        form: [''],

        price: [0, [
            Validators.required,
            Validators.min(0)
        ]],

        requiresPrescription: [false],

        stock: [0, [
            Validators.min(0)
        ]],

        categoryIds: [[] as number[]],

        therapeuticAreaIds: [[] as number[]]
    });


    ngOnInit(): void {

        this.loadCompanies();
        this.loadCategories();
        this.loadTherapeuticAreas();

        const id =
            this.route.snapshot.paramMap.get('id');

        if (id) {

            this.isEditMode = true;

            this.productId = Number(id);

            this.loadProduct();
        }

    }

    loadProduct(): void {

        this.adminService
            .getProduct(this.productId)
            .subscribe({

                next: (product: ProductResponse) => {

                    this.productForm.patchValue({

                        companyId: null,

                        name: product.name,

                        sku: product.sku,

                        description: product.description,

                        brand: product.brand,

                        activeIngredient: product.activeIngredient,

                        dosage: product.dosage,

                        form: product.form,

                        price: product.price,

                        requiresPrescription: product.requiresPrescription,

                        stock: product.stock,

                        categoryIds: [],

                        therapeuticAreaIds: []

                    });


                    this.loadProductImages();

                },
                error: err => {

                    console.error(err);

                    this.errorMessage =
                        'Impossible de charger le produit.';

                }

            });

    }

    loadProductImages(): void {

        if (!this.productId) {
            return;
        }

        this.adminService
            .getProductImages(this.productId)
            .subscribe({

                next: (images) => {

                    this.images = images;

                },

                error: (error) => {

                    console.error(
                        'Erreur chargement images :',
                        error
                    );

                    this.imageError =
                        'Impossible de charger les images du produit.';

                }

            });

    }




    loadCompanies(): void {

        this.adminService.getCompanies()
            .subscribe({
                next: data => {
                    this.companies = data;
                },
                error: err => {
                    console.error(err);
                    this.errorMessage =
                        'Impossible de charger les entreprises.';
                }
            });

    }

    addImage(): void {

        if (!this.isEditMode || !this.productId) {

            this.imageError =
                'Enregistrez d’abord le produit avant d’ajouter une image.';

            return;
        }

        if (!this.newImageUrl.trim()) {

            this.imageError =
                'Veuillez renseigner l’URL de l’image.';

            return;
        }

        this.imageLoading = true;
        this.imageError = '';

        const request = {
            imageUrl: this.newImageUrl.trim(),
            main: this.newImageMain,
            displayOrder: this.newImageDisplayOrder
        };

        this.adminService
            .addProductImage(this.productId, request)
            .subscribe({

                next: (image) => {

                    this.images = [
                        ...this.images,
                        image
                    ];

                    this.newImageUrl = '';

                    this.newImageMain = false;

                    this.newImageDisplayOrder =
                        this.images.length;

                    this.imageLoading = false;
                },

                error: (error) => {

                    console.error(
                        'Erreur ajout image :',
                        error
                    );

                    this.imageError =
                        error?.error?.message ??
                        'Impossible d’ajouter cette image.';

                    this.imageLoading = false;
                }

            });
    }

    loadCategories(): void {

        this.adminService.getCategories()
            .subscribe({
                next: data => {
                    this.categories = data;
                },
                error: err => {
                    console.error(err);
                    this.errorMessage =
                        'Impossible de charger les catégories.';
                }
            });

    }


    loadTherapeuticAreas(): void {

        this.adminService.getTherapeuticAreas()
            .subscribe({
                next: data => {
                    this.therapeuticAreas = data;
                },
                error: err => {
                    console.error(err);
                    this.errorMessage =
                        'Impossible de charger les domaines thérapeutiques.';
                }
            });

    }


    toggleCategory(id: number): void {

        const current =
            this.productForm.value.categoryIds ?? [];

        const values = current.includes(id)
            ? current.filter(x => x !== id)
            : [...current, id];

        this.productForm.patchValue({
            categoryIds: values
        });

    }


    toggleTherapeuticArea(id: number): void {

        const current =
            this.productForm.value.therapeuticAreaIds ?? [];

        const values = current.includes(id)
            ? current.filter(x => x !== id)
            : [...current, id];

        this.productForm.patchValue({
            therapeuticAreaIds: values
        });

    }


    isCategorySelected(id: number): boolean {

        return this.productForm.value.categoryIds?.includes(id) ?? false;

    }


    isTherapeuticAreaSelected(id: number): boolean {

        return this.productForm.value.therapeuticAreaIds?.includes(id) ?? false;

    }
    deleteImage(image: ProductImageResponse): void {

        if (!image.id) {
            return;
        }

        const confirmed = confirm(
            'Voulez-vous vraiment supprimer cette image ?'
        );

        if (!confirmed) {
            return;
        }

        this.imageLoading = true;
        this.imageError = '';

        this.adminService
            .deleteProductImage(image.id)
            .subscribe({

                next: () => {

                    this.images =
                        this.images.filter(
                            img => img.id !== image.id
                        );

                    this.imageLoading = false;

                },

                error: (error) => {

                    console.error(
                        'Erreur suppression image :',
                        error
                    );

                    this.imageError =
                        error?.error?.message ??
                        'Impossible de supprimer cette image.';

                    this.imageLoading = false;

                }

            });
    }

    submit(): void {

        this.successMessage = '';
        this.errorMessage = '';

        if (this.productForm.invalid) {
            console.log("yoyoyoyoy");
            this.productForm.markAllAsTouched();

            return;
        }

        this.loading = true;

        const request =
            this.productForm.getRawValue() as ProductRequest;

        const operation =
            this.isEditMode
                ? this.adminService.updateProduct(
                    this.productId,
                    request
                )
                : this.adminService.createProduct(
                    request
                );

        operation.subscribe({

                next: response => {

                    console.log(
                        'Produit créé :',
                        response
                    );

                    this.loading = false;

                    this.successMessage =
                        'Produit créé avec succès.';

                    this.productForm.reset({
                        companyId: null,
                        name: '',
                        sku: '',
                        description: '',
                        brand: '',
                        activeIngredient: '',
                        dosage: '',
                        form: '',
                        price: 0,
                        requiresPrescription: false,
                        stock: 0,
                        categoryIds: [],
                        therapeuticAreaIds: []
                    });

                    this.router.navigate(['/admin/products']);

                },

                error: error => {

                    console.error(error);

                    this.loading = false;

                    this.errorMessage =
                        error?.error?.message ??
                        'Erreur lors de la création du produit.';

                }

            });

    }

}