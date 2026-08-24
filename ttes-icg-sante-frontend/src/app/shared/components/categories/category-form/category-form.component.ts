import { Component, OnInit, inject } from '@angular/core';

import {
    FormBuilder,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';

import { CommonModule } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';

import { AdminService } from '../../../../core/services/admin.service';
import {PageBreadcrumbComponent} from "../../common/page-breadcrumb/page-breadcrumb.component";


@Component({
    selector: 'app-category-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        PageBreadcrumbComponent
    ],
    templateUrl: './category-form.component.html'
})
export class CategoryFormComponent implements OnInit {

    private fb = inject(FormBuilder);

    private adminService = inject(AdminService);

    private router = inject(Router);

    private route = inject(ActivatedRoute);


    categoryId: number | null = null;

    editMode = false;

    loading = false;

    successMessage = '';

    errorMessage = '';


    categoryForm = this.fb.group({

        name: [
            '',
            Validators.required
        ],

        description: ['']

    });


    ngOnInit(): void {

        const id =
            this.route.snapshot.paramMap.get('id');

        if (id) {

            this.categoryId =
                Number(id);

            this.editMode = true;

            this.loadCategory();

        }

    }


    loadCategory(): void {

        if (!this.categoryId) {

            return;

        }

        this.loading = true;

        this.adminService
            .getCategory(this.categoryId)
            .subscribe({

                next: category => {

                    this.categoryForm.patchValue({

                        name: category.name,

                        description:
                            category.description ?? ''

                    });

                    this.loading = false;

                },

                error: error => {

                    console.error(
                        'Erreur chargement catégorie :',
                        error
                    );

                    this.errorMessage =
                        'Impossible de charger la catégorie.';

                    this.loading = false;

                }

            });

    }


    submit(): void {

        this.successMessage = '';

        this.errorMessage = '';


        if (this.categoryForm.invalid) {

            this.categoryForm.markAllAsTouched();

            return;

        }


        this.loading = true;


        const request =
            this.categoryForm.getRawValue();


        if (this.editMode && this.categoryId) {

            this.adminService
                .updateCategory(
                    this.categoryId,
                    request
                )
                .subscribe({

                    next: () => {

                        this.loading = false;

                        this.router.navigate([
                            '/admin/categories'
                        ]);

                    },

                    error: error => {

                        console.error(error);

                        this.loading = false;

                        this.errorMessage =
                            error?.error?.message ??
                            'Erreur lors de la modification de la catégorie.';

                    }

                });

        } else {

            this.adminService
                .createCategory(request)
                .subscribe({

                    next: () => {

                        this.loading = false;

                        this.router.navigate([
                            '/admin/categories'
                        ]);

                    },

                    error: error => {

                        console.error(error);

                        this.loading = false;

                        this.errorMessage =
                            error?.error?.message ??
                            'Erreur lors de la création de la catégorie.';

                    }

                });

        }

    }


    cancel(): void {

        this.router.navigate([
            '/admin/categories'
        ]);

    }

}