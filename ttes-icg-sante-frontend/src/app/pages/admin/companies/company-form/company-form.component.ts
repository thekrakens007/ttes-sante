
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
        logoUrl: [
            '',
            [
                Validators.maxLength(400_000),
                Validators.pattern(/^(?:https?:\/\/\S{1,492}|data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2})?$/i)
            ]
        ],
        categoryId: this.fb.control<number | null>(null)
    });

    logoPreviewError = false;

    logoFileError = '';

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

    selectLogoFile(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        input.value = '';

        if (!file) {
            return;
        }

        this.logoFileError = '';
        this.logoPreviewError = false;

        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
            this.logoFileError = 'Sélectionne une image PNG, JPEG ou WebP.';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            this.logoFileError = 'L’image doit faire moins de 5 Mo.';
            return;
        }

        const reader = new FileReader();
        reader.onerror = () => {
            this.logoFileError = 'Impossible de lire le fichier image.';
        };
        reader.onload = () => {
            const image = new Image();
            image.onerror = () => {
                this.logoFileError = 'Le fichier sélectionné ne peut pas être affiché.';
            };
            image.onload = () => {
                const scale = Math.min(1, 512 / Math.max(image.width, image.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(image.width * scale));
                canvas.height = Math.max(1, Math.round(image.height * scale));

                const context = canvas.getContext('2d');

                if (!context) {
                    this.logoFileError = 'Impossible de préparer cette image.';
                    return;
                }

                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                let logoUrl = canvas.toDataURL('image/webp', 0.82);

                if (!logoUrl.startsWith('data:image/webp,')) {
                    context.fillStyle = '#ffffff';
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    context.drawImage(image, 0, 0, canvas.width, canvas.height);
                    logoUrl = canvas.toDataURL('image/jpeg', 0.82);
                }

                if (logoUrl.length > 400_000) {
                    this.logoFileError =
                        'Cette image reste trop volumineuse après compression. Choisis une image plus simple.';
                    return;
                }

                this.companyForm.controls.logoUrl.setValue(logoUrl);
                this.companyForm.controls.logoUrl.markAsDirty();
                this.logoPreviewError = false;
            };
            image.src = String(reader.result);
        };

        reader.readAsDataURL(file);
    }

    isUploadedLogo(): boolean {
        return this.companyForm.controls.logoUrl.value?.startsWith('data:image/') ?? false;
    }

    clearLogo(): void {
        this.companyForm.controls.logoUrl.setValue('');
        this.companyForm.controls.logoUrl.markAsDirty();
        this.logoPreviewError = false;
        this.logoFileError = '';
    }

    onLogoUrlInput(): void {
        this.logoPreviewError = false;
        this.logoFileError = '';
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
