import { Component, OnInit, inject } from '@angular/core';

import { RouterLink } from '@angular/router';

import { AdminService } from '../../../../core/services/admin.service';

import { CategoryResponse } from '../../../../core/interfaces/category-response.interface';

import { BadgeComponent } from '../../ui/badge/badge.component';


@Component({
    selector: 'app-category-table',
    standalone: true,
    imports: [
        BadgeComponent,
        RouterLink
    ],
    templateUrl: './category-table.component.html'
})
export class CategoryTableComponent implements OnInit {

    private adminService = inject(AdminService);

    categories: CategoryResponse[] = [];

    loading = false;

    errorMessage = '';


    ngOnInit(): void {

        this.loadCategories();

    }


    loadCategories(): void {

        this.loading = true;

        this.errorMessage = '';

        this.adminService
            .getCategories()
            .subscribe({

                next: categories => {

                    this.categories = categories;

                    this.loading = false;

                },

                error: error => {

                    console.error(
                        'Erreur chargement catégories :',
                        error
                    );

                    this.errorMessage =
                        'Impossible de charger les catégories.';

                    this.loading = false;

                }

            });

    }


    deleteCategory(
        category: CategoryResponse
    ): void {

        const confirmed = confirm(
            `Voulez-vous vraiment supprimer la catégorie "${category.name}" ?`
        );

        if (!confirmed) {

            return;

        }

        this.adminService
            .deleteCategory(category.id)
            .subscribe({

                next: () => {

                    this.categories =
                        this.categories.filter(
                            item => item.id !== category.id
                        );

                },

                error: error => {

                    console.error(
                        'Erreur suppression catégorie :',
                        error
                    );

                    this.errorMessage =
                        'Impossible de supprimer la catégorie.';

                }

            });

    }


    refresh(): void {

        this.loadCategories();

    }

}