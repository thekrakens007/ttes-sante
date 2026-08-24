import { Component } from '@angular/core';

import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

import { CategoryTableComponent } from '../../shared/components/categories/category-table/category-table.component';
import {RouterLink} from "@angular/router";

@Component({
    selector: 'app-categories',
    standalone: true,
    imports: [
        ComponentCardComponent,
        PageBreadcrumbComponent,
        CategoryTableComponent,
        RouterLink
    ],
    templateUrl: './categories.component.html'
})
export class CategoriesComponent {

}