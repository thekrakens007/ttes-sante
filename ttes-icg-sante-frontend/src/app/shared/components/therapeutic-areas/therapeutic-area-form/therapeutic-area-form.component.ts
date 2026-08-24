import {
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
    inject
} from '@angular/core';

import {
    FormBuilder,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';

import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';

import { AdminService } from '../../../../core/services/admin.service';

import { TherapeuticAreaRequest } from '../../../../core/interfaces/therapeutic-area-request.interface';


@Component({
    selector: 'app-therapeutic-area-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule
    ],
    templateUrl: './therapeutic-area-form.component.html'
})
export class TherapeuticAreaFormComponent implements OnInit {

    private fb = inject(FormBuilder);

    private adminService = inject(AdminService);

    private router = inject(Router);


    @Input()
    therapeuticAreaId: number | null = null;


    isEditMode = false;

    loading = false;

    successMessage = '';

    errorMessage = '';


    form = this.fb.group({

        name: [
            '',
            Validators.required
        ],

        description: ['']

    });


    ngOnInit(): void {

        if (this.therapeuticAreaId) {

            this.isEditMode = true;

            this.loadTherapeuticArea();

        }

    }


    loadTherapeuticArea(): void {

        this.loading = true;

        this.adminService
            .getTherapeuticArea(
                this.therapeuticAreaId!
            )
            .subscribe({

                next: area => {

                    this.form.patchValue({

                        name: area.name,

                        description: area.description ?? ''

                    });

                    this.loading = false;

                },

                error: error => {

                    console.error(error);

                    this.errorMessage =
                        'Impossible de charger le domaine thérapeutique.';

                    this.loading = false;

                }

            });

    }


    submit(): void {

        this.successMessage = '';

        this.errorMessage = '';


        if (this.form.invalid) {

            this.form.markAllAsTouched();

            return;

        }


        this.loading = true;


        const request:
            TherapeuticAreaRequest = {

            name:
                this.form.value.name ?? '',

            description:
                this.form.value.description ?? ''

        };


        if (this.isEditMode) {

            this.update(request);

        } else {

            this.create(request);

        }

    }


    create(
        request: TherapeuticAreaRequest
    ): void {

        this.adminService
            .createTherapeuticArea(request)
            .subscribe({

                next: () => {

                    this.loading = false;

                    this.successMessage =
                        'Domaine thérapeutique créé avec succès.';

                    this.form.reset({

                        name: '',

                        description: ''

                    });
                    this.cancel();

                },

                error: error => {

                    console.error(error);

                    this.loading = false;

                    this.errorMessage =
                        error?.error?.message ??
                        'Erreur lors de la création.';

                }

            });

    }


    update(
        request: TherapeuticAreaRequest
    ): void {

        this.adminService
            .updateTherapeuticArea(
                this.therapeuticAreaId!,
                request
            )
            .subscribe({

                next: () => {

                    this.loading = false;

                    this.successMessage =
                        'Domaine thérapeutique modifié avec succès.';
                    this.cancel();

                },

                error: error => {

                    console.error(error);

                    this.loading = false;

                    this.errorMessage =
                        error?.error?.message ??
                        'Erreur lors de la modification.';

                }

            });

    }


    cancel(): void {

        this.router.navigate([
            '/admin/therapeutic-areas'
        ]);

    }

}