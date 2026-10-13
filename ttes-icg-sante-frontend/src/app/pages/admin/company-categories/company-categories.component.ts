
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { CompanyCategoryRequest } from '../../../core/interfaces/company-category-request.interface';
import { CompanyCategoryResponse } from '../../../core/interfaces/company-category-response.interface';

@Component({
    selector: 'app-company-categories',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './company-categories.component.html'
})
export class CompanyCategoriesComponent implements OnInit {
    private adminService = inject(AdminService);

    categories: CompanyCategoryResponse[] = [];
    form: CompanyCategoryRequest = { name: '', description: '' };
    editingId: number | null = null;
    loading = false;
    saving = false;
    errorMessage = '';
    successMessage = '';

    ngOnInit(): void {
        this.loadCategories();
    }

    loadCategories(): void {
        this.loading = true;
        this.adminService.getCompanyCategories().subscribe({
            next: (data) => {
                this.categories = data;
                this.loading = false;
            },
            error: () => {
                this.errorMessage = 'Impossible de charger les catégories.';
                this.loading = false;
            }
        });
    }

    saveCategory(): void {
        const name = this.form.name?.trim();

        if (!name || this.saving) {
            return;
        }

        this.saving = true;
        this.errorMessage = '';
        this.successMessage = '';

        const request: CompanyCategoryRequest = {
            name,
            description: this.form.description?.trim() || ''
        };

        const operation = this.editingId === null
            ? this.adminService.createCompanyCategory(request)
            : this.adminService.updateCompanyCategory(this.editingId, request);

        operation.subscribe({
            next: () => {
                this.successMessage = this.editingId === null
                    ? 'Catégorie créée avec succès.'
                    : 'Catégorie modifiée avec succès.';

                this.cancelEdit();
                this.loadCategories();
                this.saving = false;
            },
            error: (error) => {
                this.errorMessage =
                    error?.error?.message || 'Erreur lors de l’enregistrement.';
                this.saving = false;
            }
        });
    }

    editCategory(category: CompanyCategoryResponse): void {
        this.editingId = category.id;
        this.form = {
            name: category.name,
            description: category.description || ''
        };
        this.errorMessage = '';
        this.successMessage = '';
    }

    cancelEdit(): void {
        this.editingId = null;
        this.form = { name: '', description: '' };
    }

    deleteCategory(category: CompanyCategoryResponse): void {
        if (!confirm(`Supprimer la catégorie « ${category.name} » ?`)) {
            return;
        }

        this.errorMessage = '';
        this.successMessage = '';

        this.adminService.deleteCompanyCategory(category.id).subscribe({
            next: () => {
                this.successMessage = 'Catégorie supprimée.';
                this.loadCategories();
            },
            error: (error) => {
                this.errorMessage =
                    error?.error?.message ||
                    'Suppression impossible. Cette catégorie est peut-être utilisée par une entreprise.';
            }
        });
    }
}
