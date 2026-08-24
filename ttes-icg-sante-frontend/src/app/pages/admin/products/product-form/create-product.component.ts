import { Component } from '@angular/core';

import { PageBreadcrumbComponent } from '../../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../../../shared/components/common/component-card/component-card.component';

import { ProductFormComponent } from '../../../../shared/components/products/product-form/product-form.component';

@Component({
    selector: 'app-create-product',
    standalone: true,
    imports: [
        PageBreadcrumbComponent,
        ComponentCardComponent,
        ProductFormComponent
    ],
    templateUrl: './create-product.component.html'
})
export class CreateProductComponent {
}