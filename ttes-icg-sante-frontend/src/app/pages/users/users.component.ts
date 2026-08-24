import { Component } from '@angular/core';

import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

import { UsersTableComponent } from '../../shared/components/users/users-table/users-table.component';

@Component({
    selector: 'app-users',
    imports: [
        ComponentCardComponent,
        PageBreadcrumbComponent,
        UsersTableComponent
    ],
    templateUrl: './users.component.html',
    styles: ``
})
export class UsersComponent {

}