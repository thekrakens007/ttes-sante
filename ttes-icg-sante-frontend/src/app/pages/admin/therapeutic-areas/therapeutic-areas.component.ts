import { Component } from '@angular/core';

import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../../shared/components/common/component-card/component-card.component';

import { TherapeuticAreaTableComponent } from '../../../shared/components/therapeutic-areas/therapeutic-area-table/therapeutic-area-table.component';

@Component({
    selector: 'app-therapeutic-areas',
    standalone: true,
    imports: [
        PageBreadcrumbComponent,
        ComponentCardComponent,
        TherapeuticAreaTableComponent
    ],
    templateUrl: './therapeutic-areas.component.html'
})
export class TherapeuticAreasComponent {
}