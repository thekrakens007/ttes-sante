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

    private router = inject(Router);

    companyId?: number;

    editMode = false;

    loading = false;

    successMessage = '';

    errorMessage = '';

    companyForm = this.fb.group({

        name: ['', Validators.required],

        description: [''],

        country: [''],

        website: ['']

    });

    ngOnInit(): void {

        const id =
            this.route.snapshot.paramMap.get('id');

        if (id) {

            this.companyId = Number(id);

            this.editMode = true;

            this.loadCompany();

        }

    }

    loadCompany(): void {

        if (!this.companyId) {
            return;
        }

        this.loading = true;

        this.adminService
            .getCompany(this.companyId)
            .subscribe({

                next: company => {

                    this.companyForm.patchValue({

                        name: company.name,

                        description: company.description,

                        country: company.country,

                        website: company.website

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

        if (this.companyForm.invalid) {

            this.companyForm.markAllAsTouched();

            return;

        }

        this.loading = true;

        const request =
            this.companyForm.getRawValue() as CompanyRequest;

        if (this.editMode && this.companyId) {

            this.adminService
                .updateCompany(
                    this.companyId,
                    request
                )
                .subscribe({

                    next: () => {

                        this.router.navigate([
                            '/admin/companies'
                        ]);

                    },

                    error: err => {

                        console.error(err);

                        this.loading = false;

                    }

                });

        } else {

            this.adminService
                .createCompany(request)
                .subscribe({

                    next: () => {

                        this.router.navigate([
                            '/admin/companies'
                        ]);

                    },

                    error: err => {

                        console.error(err);

                        this.loading = false;

                    }

                });

        }

    }

}