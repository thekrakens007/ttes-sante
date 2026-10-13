
import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
    FormBuilder,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';

import {
    ActivatedRoute,
    Router
} from '@angular/router';

import { AdminService } from '../../../../core/services/admin.service';
import { CompanyRequest } from '../../../../core/interfaces/company-request.interface';
import { CompanyCategoryResponse } from '../../../../core/interfaces/company-category-response.interface';

@Component({
    selector: 'app-company-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule
    ],
    templateUrl: './company-form.component.html'
})
export class CompanyFormComponent implements OnInit {

    private fb = inject(FormBuilder);
    private adminService = inject(AdminService);
    private route = inject(ActivatedRoute);
    readonly router = inject(Router);

    companyId?: number;
    editMode = false;
    loading = false;
    loadingCategories = false;

    successMessage = '';
    errorMessage = '';

    categories: CompanyCategoryResponse[] = [];

    companyForm = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(255)]],
        description: [''],
        country: [''],
        website: [''],
        logoUrl: [''],
        categoryId: this.fb.control<number | null>(null)
    });

    ngOnInit(): void {
        this.loadCategories();

        const id = this.route.snapshot.paramMap.get('id');

        if (id) {
            this.companyId = Number(id);
            this.editMode = true;
            this.loadCompany();
        }
    }

    loadCategories(): void {
        this.loadingCategories = true;

        this.adminService.getCompanyCategories().subscribe({
            next: categories => {
                this.categories = categories;
                this.loadingCategories = false;
            },
            error: err => {
                console.error('Erreur de chargement des catégories :', err);
                this.errorMessage =
                    'Impossible de charger les catégories d’entreprises.';
                this.loadingCategories = false;
            }
        });
    }

    loadCompany(): void {
        if (!this.companyId) {
            return;
        }

        this.loading = true;

        this.adminService.getCompany(this.companyId).subscribe({
            next: company => {
                this.companyForm.patchValue({
                    name: company.name ?? '',
                    description: company.description ?? '',
                    country: company.country ?? '',
                    website: company.website ?? '',
                    logoUrl: company.logoUrl ?? '',
                    categoryId: company.categoryId ?? null
                });

                this.loading = false;
            },
            error: err => {
                console.error(err);
                this.errorMessage =
                    'Impossible de charger l’entreprise.';
                this.loading = false;
            }
        });
    }

    submit(): void {
        this.errorMessage = '';
        this.successMessage = '';

        if (this.companyForm.invalid) {
            this.companyForm.markAllAsTouched();
            return;
        }

        this.loading = true;

        const request =
            this.companyForm.getRawValue() as CompanyRequest;

        const operation = this.editMode && this.companyId
            ? this.adminService.updateCompany(this.companyId, request)
            : this.adminService.createCompany(request);

        operation.subscribe({
            next: () => {
                this.router.navigate(['/admin/companies']);
            },
            error: err => {
                console.error('Erreur d’enregistrement :', err);

                this.errorMessage =
                    err?.error?.message ||
                    'Impossible d’enregistrer cette entreprise.';

                this.loading = false;
            }
        });
    }
}
