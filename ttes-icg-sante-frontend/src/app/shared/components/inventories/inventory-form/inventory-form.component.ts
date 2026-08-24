import {
    Component,
    Input,
    OnInit,
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

import { InventoryRequest } from '../../../../core/interfaces/inventory-request.interface';


@Component({
    selector: 'app-inventory-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule
    ],
    templateUrl: './inventory-form.component.html'
})
export class InventoryFormComponent
    implements OnInit {

    private fb = inject(FormBuilder);

    private adminService =
        inject(AdminService);

    private router = inject(Router);


    @Input()
    productId!: number;


    productName = '';

    loading = false;

    successMessage = '';

    errorMessage = '';


    form = this.fb.group({

        quantity: [
            0,
            [
                Validators.required,
                Validators.min(0)
            ]
        ],

        minimumQuantity: [
            0,
            [
                Validators.required,
                Validators.min(0)
            ]
        ]

    });


    ngOnInit(): void {

        this.loadInventory();

    }


    loadInventory(): void {

        this.loading = true;

        this.adminService
            .getInventory(this.productId)
            .subscribe({

                next: inventory => {

                    this.productName =
                        inventory.productName;

                    this.form.patchValue({

                        quantity:
                        inventory.quantity,

                        minimumQuantity:
                        inventory.minimumQuantity

                    });

                    this.loading = false;

                },

                error: error => {

                    console.error(error);

                    this.errorMessage =
                        'Impossible de charger le stock.';

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


        const request:
            InventoryRequest = {

            quantity:
                this.form.value.quantity ?? 0,

            minimumQuantity:
                this.form.value.minimumQuantity ?? 0

        };


        this.loading = true;


        this.adminService
            .updateInventory(
                this.productId,
                request
            )
            .subscribe({

                next: () => {

                    this.loading = false;

                    this.successMessage =
                        'Stock mis à jour avec succès.';
                    this.cancel();

                },

                error: error => {

                    console.error(error);

                    this.loading = false;

                    this.errorMessage =
                        error?.error?.message ??
                        'Erreur lors de la mise à jour du stock.';

                }

            });

    }


    cancel(): void {

        this.router.navigate([
            '/admin/inventories'
        ]);

    }

}