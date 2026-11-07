
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
    FormBuilder,
    FormsModule,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { CureService } from '../../../../core/services/cure.service';
import {
    Cure,
    CureRequest,
    CureType
} from '../../../../core/models/cure.model';

@Component({
    selector: 'app-cure-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule
    ],
    templateUrl: './cure-form.component.html'
})
export class CureFormComponent implements OnInit {

    private readonly fb = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly cureService = inject(CureService);

    cureId: number | null = null;
    isEditMode = false;

    loading = false;
    saving = false;
    previewFailed = false;

    errorMessage = '';
    successMessage = '';

    readonly cureTypes: { value: CureType; label: string }[] = [
        { value: 'PREVENTIVE', label: 'Préventive' },
        { value: 'CURATIVE', label: 'Curative' }
    ];

    form = this.fb.nonNullable.group({
        name: ['', [
            Validators.required,
            Validators.maxLength(180)
        ]],

        description: ['', [
            Validators.maxLength(10000)
        ]],

        imageUrl: ['', [
            Validators.maxLength(1000)
        ]],

        type: ['PREVENTIVE' as CureType, [
            Validators.required
        ]],

        price: [0, [
            Validators.required,
            Validators.min(0)
        ]],

        active: [false]
    });

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));

        this.cureId = Number.isInteger(id) && id > 0 ? id : null;
        this.isEditMode = this.cureId !== null;

        if (this.isEditMode && this.cureId !== null) {
            this.loadCure(this.cureId);
        }
        this.form.get('imageUrl')?.valueChanges.subscribe(() => {
            this.previewFailed = false;
        });
    }

    // ============================================================
    // CHARGEMENT D'UNE CURE
    // ============================================================

    private loadCure(id: number): void {
        this.loading = true;
        this.errorMessage = '';

        this.cureService.getAdminCure(id).subscribe({
            next: (cure: Cure) => {
                this.form.patchValue({
                    name: cure.name,
                    description: cure.description ?? '',
                    imageUrl: cure.imageUrl ?? '',
                    type: cure.type,
                    price: cure.price,
                    active: cure.active
                });

                this.loading = false;
            },

            error: (error) => {
                console.error(
                    'Erreur de chargement de la cure',
                    error
                );

                this.errorMessage =
                    'Impossible de charger cette cure.';

                this.loading = false;
            }
        });
    }

    // ============================================================
    // FORMATAGE DU PRIX
    // ============================================================

    formatPrice(price: number): string {
        return `${price.toLocaleString('fr-FR')} FCFA`;
    }

    // ============================================================
    // ENREGISTREMENT
    // ============================================================

    save(): void {
        this.errorMessage = '';
        this.successMessage = '';

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.errorMessage =
                'Vérifie les champs obligatoires et le prix.';
            return;
        }

        const values = this.form.getRawValue();

        const request: CureRequest = {
            name: values.name.trim(),
            description: values.description.trim() || null,
            imageUrl: values.imageUrl.trim() || null,
            type: values.type,
            price: values.price,
            active: values.active
        };

        this.saving = true;

        const operation = this.isEditMode && this.cureId !== null
            ? this.cureService.updateCure(this.cureId, request)
            : this.cureService.createCure(request);

        operation.subscribe({
            next: () => {
                this.saving = false;
                this.router.navigate(['/admin/cures']);
            },

            error: (error) => {
                console.error(
                    'Erreur de sauvegarde de la cure',
                    error
                );

                this.errorMessage =
                    error?.error?.message ??
                    'Impossible d’enregistrer la cure.';

                this.saving = false;
            }
        });
    }

    // ============================================================
    // ANNULATION
    // ============================================================

    cancel(): void {
        this.router.navigate(['/admin/cures']);
    }

    get previewImageUrl(): string | null {
        const imageUrl = this.form?.get('imageUrl')?.value;

        return imageUrl?.trim() || null;
    }

    onPreviewError(): void {
        this.previewFailed = true;
    }


}
