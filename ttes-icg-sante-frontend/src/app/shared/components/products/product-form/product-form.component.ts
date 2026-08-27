import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
    FormBuilder,
    FormsModule,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import { AdminService } from '../../../../core/services/admin.service';

import { CompanyResponse } from '../../../../core/interfaces/company-response.interface';
import { CategoryResponse } from '../../../../core/interfaces/category-response.interface';
import { TherapeuticAreaResponse } from '../../../../core/interfaces/therapeutic-area-response.interface';
import { ProductRequest } from '../../../../core/interfaces/product-request.interface';
import { ProductResponse } from '../../../../core/interfaces/product-response.interface';
import { ProductImageResponse } from '../../../../core/interfaces/product-image-response.interface';
import {forkJoin} from "rxjs";


@Component({
    selector: 'app-product-form',
    standalone: true,

    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule
    ],

    templateUrl: './product-form.component.html'
})
export class ProductFormComponent implements OnInit {

    // ==========================================
    // SERVICES
    // ==========================================

    private fb = inject(FormBuilder);

    private adminService = inject(AdminService);

    private route = inject(ActivatedRoute);

    private router = inject(Router);


    // ==========================================
    // LISTES
    // ==========================================

    companies: CompanyResponse[] = [];

    categories: CategoryResponse[] = [];

    therapeuticAreas: TherapeuticAreaResponse[] = [];


    // ==========================================
    // IMAGES
    // ==========================================

    images: ProductImageResponse[] = [];

    newImageUrl = '';

    newImageMain = false;

    newImageDisplayOrder = 0;

    imageLoading = false;

    imageError = '';


    // ==========================================
    // ETAT
    // ==========================================

    isEditMode = false;

    productId!: number;

    loading = false;

    successMessage = '';

    errorMessage = '';


    // ==========================================
    // FORMULAIRE
    // ==========================================

    productForm = this.fb.group({

        companyId: [
            null as number | null,
            Validators.required
        ],

        name: [
            '',
            Validators.required
        ],

        sku: [
            '',
            Validators.required
        ],

        description: [
            ''
        ],

        brand: [
            ''
        ],

        activeIngredient: [
            ''
        ],

        dosage: [
            ''
        ],

        form: [
            ''
        ],

        price: [
            0,
            [
                Validators.required,
                Validators.min(0)
            ]
        ],

        requiresPrescription: [
            false
        ],

        stock: [
            0,
            [
                Validators.required,
                Validators.min(0)
            ]
        ],

        categoryIds: [
            [] as number[]
        ],

        therapeuticAreaIds: [
            [] as number[]
        ]

    });


    // ==========================================
    // INIT
    // ==========================================

    ngOnInit(): void {

        const id =
            this.route.snapshot.paramMap.get('id');


        if (id) {

            this.isEditMode = true;

            this.productId = Number(id);


            forkJoin({

                companies:
                    this.adminService.getCompanies(),

                categories:
                    this.adminService.getCategories(),

                therapeuticAreas:
                    this.adminService.getTherapeuticAreas()

            }).subscribe({

                next: (data) => {

                    this.companies =
                        data.companies;

                    this.categories =
                        data.categories;

                    this.therapeuticAreas =
                        data.therapeuticAreas;


                    console.log(
                        'Entreprises chargées :',
                        this.companies
                    );

                    console.log(
                        'Catégories chargées :',
                        this.categories
                    );

                    console.log(
                        'Domaines thérapeutiques chargés :',
                        this.therapeuticAreas
                    );


                    // Maintenant seulement on charge le produit
                    this.loadProduct();

                },

                error: (error) => {

                    console.error(
                        'Erreur chargement données formulaire :',
                        error
                    );

                    this.errorMessage =
                        'Impossible de charger les données du formulaire.';

                }

            });

        } else {

            // Mode création
            this.loadCompanies();
            this.loadCategories();
            this.loadTherapeuticAreas();

        }

    }

    // ==========================================
    // CHARGER PRODUIT
    // ==========================================

    loadProduct(): void {

        this.adminService
            .getProduct(this.productId)
            .subscribe({

                next: (product: ProductResponse) => {

                    console.log(
                        'Produit chargé pour modification :',
                        product
                    );

                    // ======================================
                    // EXTRACTION DES RELATIONS
                    // ======================================

                    const companyId =
                        this.extractCompanyId(product);

                    const categoryIds =
                        this.extractCategoryIds(product);

                    const therapeuticAreaIds =
                        this.extractTherapeuticAreaIds(product);


                    console.log('companyId extrait :', companyId);
                    console.log('categoryIds extraits :', categoryIds);
                    console.log(
                        'therapeuticAreaIds extraits :',
                        therapeuticAreaIds
                    );


                    // ======================================
                    // REMPLIR LE FORMULAIRE
                    // ======================================

                    this.productForm.patchValue({

                        companyId: companyId,

                        name:
                            product.name ?? '',

                        sku:
                            product.sku ?? '',

                        description:
                            product.description ?? '',

                        brand:
                            product.brand ?? '',

                        activeIngredient:
                            product.activeIngredient ?? '',

                        dosage:
                            product.dosage ?? '',

                        form:
                            product.form ?? '',

                        price:
                            product.price ?? 0,

                        requiresPrescription:
                            product.requiresPrescription ?? false,

                        stock:
                            product.stock ?? 0,

                        categoryIds:
                        categoryIds,

                        therapeuticAreaIds:
                        therapeuticAreaIds

                    });


                    console.log(
                        'Formulaire après chargement :',
                        this.productForm.getRawValue()
                    );


                    this.loadProductImages();

                },

                error: err => {

                    console.error(
                        'Erreur chargement produit :',
                        err
                    );

                    this.errorMessage =
                        'Impossible de charger le produit.';

                }

            });

    }


    // ==========================================
    // EXTRAIRE ENTREPRISE
    // ==========================================

    private extractCompanyId(
        product: any
    ): number | null {

        // Cas 1 : companyId directement fourni
        if (
            product.companyId !== null &&
            product.companyId !== undefined
        ) {
            return Number(product.companyId);
        }


        // Cas 2 : objet company
        if (
            product.company &&
            product.company.id !== undefined
        ) {
            return Number(product.company.id);
        }


        // Cas 3 : companyName fourni
        if (product.companyName) {

            const company =
                this.companies.find(
                    c =>
                        c.name?.trim().toLowerCase() ===
                        product.companyName.trim().toLowerCase()
                );

            return company?.id ?? null;
        }


        return null;
    }


    // ==========================================
    // EXTRAIRE CATEGORIES
    // ==========================================

    private extractCategoryIds(
        product: any
    ): number[] {

        // Cas 1 : categoryIds déjà présents
        if (
            Array.isArray(product.categoryIds)
        ) {

            return product.categoryIds
                .map((id: any) => Number(id))
                .filter(
                    (id: number) => !isNaN(id)
                );

        }


        // Cas 2 : categories
        if (
            Array.isArray(product.categories)
        ) {

            return product.categories
                .map((category: any) => {

                    // Si c'est directement un ID
                    if (
                        typeof category === 'number'
                    ) {
                        return category;
                    }


                    // Si c'est un objet {id, name}
                    if (
                        category &&
                        typeof category === 'object' &&
                        category.id !== undefined
                    ) {
                        return Number(category.id);
                    }


                    // Si c'est simplement le nom
                    if (
                        typeof category === 'string'
                    ) {

                        const found =
                            this.categories.find(
                                c =>
                                    c.name?.trim().toLowerCase() ===
                                    category.trim().toLowerCase()
                            );

                        return found?.id ?? NaN;
                    }


                    return NaN;

                })
                .filter(
                    (id: number) => !isNaN(id)
                );

        }


        return [];
    }


    // ==========================================
    // EXTRAIRE DOMAINES THERAPEUTIQUES
    // ==========================================

    private extractTherapeuticAreaIds(
        product: any
    ): number[] {

        // Cas 1 : IDs directement fournis
        if (
            Array.isArray(product.therapeuticAreaIds)
        ) {

            return product.therapeuticAreaIds
                .map((id: any) => Number(id))
                .filter(
                    (id: number) => !isNaN(id)
                );

        }


        // Cas 2 : therapeuticAreas
        if (
            Array.isArray(product.therapeuticAreas)
        ) {

            return product.therapeuticAreas
                .map((area: any) => {

                    // ID directement
                    if (
                        typeof area === 'number'
                    ) {
                        return area;
                    }


                    // Objet {id, name}
                    if (
                        area &&
                        typeof area === 'object' &&
                        area.id !== undefined
                    ) {
                        return Number(area.id);
                    }


                    // Nom directement
                    if (
                        typeof area === 'string'
                    ) {

                        const found =
                            this.therapeuticAreas.find(
                                a =>
                                    a.name?.trim().toLowerCase() ===
                                    area.trim().toLowerCase()
                            );

                        return found?.id ?? NaN;
                    }


                    return NaN;

                })
                .filter(
                    (id: number) => !isNaN(id)
                );

        }


        return [];
    }


    // ==========================================
    // IMAGES
    // ==========================================

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


    // ==========================================
    // ENTREPRISES
    // ==========================================

    loadCompanies(): void {

        this.adminService
            .getCompanies()
            .subscribe({

                next: (data) => {

                    this.companies = data;

                    console.log(
                        'Entreprises chargées :',
                        data
                    );

                },

                error: (error) => {

                    console.error(
                        'Erreur entreprises :',
                        error
                    );

                    this.errorMessage =
                        'Impossible de charger les entreprises.';

                }

            });

    }


    // ==========================================
    // CATEGORIES
    // ==========================================

    loadCategories(): void {

        this.adminService
            .getCategories()
            .subscribe({

                next: (data) => {

                    this.categories = data;

                    console.log(
                        'Catégories chargées :',
                        data
                    );

                },

                error: (error) => {

                    console.error(
                        'Erreur catégories :',
                        error
                    );

                    this.errorMessage =
                        'Impossible de charger les catégories.';

                }

            });

    }


    // ==========================================
    // DOMAINES THERAPEUTIQUES
    // ==========================================

    loadTherapeuticAreas(): void {

        this.adminService
            .getTherapeuticAreas()
            .subscribe({

                next: (data) => {

                    this.therapeuticAreas = data;

                    console.log(
                        'Domaines thérapeutiques chargés :',
                        data
                    );

                },

                error: (error) => {

                    console.error(
                        'Erreur domaines thérapeutiques :',
                        error
                    );

                    this.errorMessage =
                        'Impossible de charger les domaines thérapeutiques.';

                }

            });

    }


    // ==========================================
    // CATEGORIES
    // ==========================================

    toggleCategory(
        id: number
    ): void {

        const current =
            this.productForm
                .get('categoryIds')
                ?.value ?? [];


        const values =
            current.includes(id)

                ? current.filter(
                    (x: number) =>
                        x !== id
                )

                : [
                    ...current,
                    id
                ];


        this.productForm.patchValue({

            categoryIds:
            values

        });

    }


    isCategorySelected(
        id: number
    ): boolean {

        const ids =
            this.productForm
                .get('categoryIds')
                ?.value ?? [];


        return ids.includes(id);

    }


    // ==========================================
    // DOMAINES THERAPEUTIQUES
    // ==========================================

    toggleTherapeuticArea(
        id: number
    ): void {

        const current =
            this.productForm
                .get('therapeuticAreaIds')
                ?.value ?? [];


        const values =
            current.includes(id)

                ? current.filter(
                    (x: number) =>
                        x !== id
                )

                : [
                    ...current,
                    id
                ];


        this.productForm.patchValue({

            therapeuticAreaIds:
            values

        });

    }


    isTherapeuticAreaSelected(
        id: number
    ): boolean {

        const ids =
            this.productForm
                .get('therapeuticAreaIds')
                ?.value ?? [];


        return ids.includes(id);

    }


    // ==========================================
    // AJOUT IMAGE
    // ==========================================

    addImage(): void {

        if (
            !this.isEditMode ||
            !this.productId
        ) {

            this.imageError =
                'Enregistrez d’abord le produit avant d’ajouter une image.';

            return;

        }


        if (
            !this.newImageUrl.trim()
        ) {

            this.imageError =
                'Veuillez renseigner l’URL de l’image.';

            return;

        }


        this.imageLoading = true;

        this.imageError = '';


        const request = {

            imageUrl:
                this.newImageUrl.trim(),

            main:
            this.newImageMain,

            displayOrder:
            this.newImageDisplayOrder

        };


        this.adminService
            .addProductImage(
                this.productId,
                request
            )
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


    // ==========================================
    // SUPPRIMER IMAGE
    // ==========================================

    deleteImage(
        image: ProductImageResponse
    ): void {

        if (!image.id) {
            return;
        }


        const confirmed =
            confirm(
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
                            img =>
                                img.id !== image.id
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


    // ==========================================
    // SUBMIT
    // ==========================================

    submit(): void {

        this.successMessage = '';

        this.errorMessage = '';


        if (
            this.productForm.invalid
        ) {

            console.log(
                'Formulaire invalide :',
                this.productForm.getRawValue()
            );

            this.productForm.markAllAsTouched();

            return;

        }


        this.loading = true;


        const formValue =
            this.productForm.getRawValue();


        /*
         * ==========================================
         * CONSTRUCTION EXPLICITE DU REQUEST
         * ==========================================
         */

        const request: ProductRequest =
            {

                companyId:
                    formValue.companyId!,

                name:
                    formValue.name!,

                sku:
                    formValue.sku!,

                description:
                    formValue.description ?? '',

                brand:
                    formValue.brand ?? '',

                activeIngredient:
                    formValue.activeIngredient ?? '',

                dosage:
                    formValue.dosage ?? '',

                form:
                    formValue.form ?? '',

                price:
                    Number(formValue.price ?? 0),

                requiresPrescription:
                    formValue.requiresPrescription ?? false,

                stock:

                    Number(formValue.stock ?? 0),

                categoryIds:
                    formValue.categoryIds ?? [],

                therapeuticAreaIds:
                    formValue.therapeuticAreaIds ?? []

            };


        console.log(
            'REQUEST ENVOYÉ AU BACKEND :',
            request
        );


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

            next: (response) => {

                console.log(
                    'Réponse backend :',
                    response
                );


                this.loading = false;


                this.successMessage =
                    this.isEditMode
                        ? 'Produit mis à jour avec succès.'
                        : 'Produit créé avec succès.';


                /*
                 * En création, on retourne à la liste.
                 */

                this.router.navigate(
                    ['/admin/products']
                );

            },

            error: (error) => {

                console.error(
                    'Erreur sauvegarde produit :',
                    error
                );


                this.loading = false;


                this.errorMessage =
                    error?.error?.message ??
                    'Erreur lors de la sauvegarde du produit.';

            }

        });

    }

}