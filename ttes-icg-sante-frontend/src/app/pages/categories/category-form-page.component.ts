import { Component } from '@angular/core';

import { CategoryFormComponent } from '../../shared/components/categories/category-form/category-form.component';


@Component({
    selector: 'app-category-form-page',
    standalone: true,
    imports: [
        CategoryFormComponent
    ],
    template: `
        <app-category-form />
    `
})
export class CategoryFormPageComponent {

}