import { Component } from '@angular/core';

import { ComponentCardComponent } from '../../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { CompanyTableComponent } from '../../../shared/components/companies/company-table/company-table.component';
import {RouterModule} from "@angular/router";

@Component({
    selector: 'app-companies',
    standalone: true,
    imports: [
        ComponentCardComponent,
        PageBreadcrumbComponent,
        CompanyTableComponent,
        RouterModule
    ],
    templateUrl: './companies.component.html',
    styles: ``
})
export class CompaniesComponent {

}