import { Component } from '@angular/core';

import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

import { ComponentCardComponent } from '../../../shared/components/common/component-card/component-card.component';

import { InventoryTableComponent } from '../../../shared/components/inventories/inventory-table/inventory-table.component';


@Component({
    selector: 'app-inventories',
    standalone: true,
    imports: [
        PageBreadcrumbComponent,
        ComponentCardComponent,
        InventoryTableComponent
    ],
    templateUrl: './inventories.component.html'
})
export class InventoriesComponent {
}