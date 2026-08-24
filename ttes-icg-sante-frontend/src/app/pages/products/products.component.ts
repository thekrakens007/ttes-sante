import { Component } from '@angular/core';

import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ProductTableComponent } from '../../shared/components/products/product-table/product-table.component';

import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-products-page',
    standalone: true,
    imports: [
        RouterLink,
        ComponentCardComponent,
        ProductTableComponent,
        PageBreadcrumbComponent
    ],
    templateUrl: './products.component.html'
})
export class ProductsComponent {}