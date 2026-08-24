import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
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

@Component({
    selector: 'app-product-form',
    imports: [
        CommonModule,
        ReactiveFormsModule
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

                        companyId: null, // à ajuster si disponible

                        name: product.name,

                        sku: product.sku,

                        description:
                        product.description,

                        brand:
                        product.brand,

                        activeIngredient:
                        product.activeIngredient,

                        dosage:
                        product.dosage,

                        form:
                        product.form,

                        price:
                        product.price,

                        requiresPrescription:
                        product.requiresPrescription,

                        stock:
                        product.stock

                    });

                },

                error: err => {

                    console.error(err);

                    this.errorMessage =
                        'Impossible de charger le produit.';

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