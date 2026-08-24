import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';

import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

import { InventoryFormComponent } from '../../../shared/components/inventories/inventory-form/inventory-form.component';


@Component({
    selector: 'app-inventory-edit',
    standalone: true,
    imports: [
        PageBreadcrumbComponent,
        InventoryFormComponent
    ],
    template: `
        <app-page-breadcrumb
            pageTitle="Modifier le stock" />

        <div class="space-y-6">

            <app-inventory-form
                [productId]="productId" />

        </div>
    `
})
export class InventoryEditComponent
    implements OnInit {

    private route =
        inject(ActivatedRoute);

    productId!: number;


    ngOnInit(): void {

        this.productId =
            Number(
                this.route.snapshot
                    .paramMap
                    .get('productId')
            );

    }

}