import { Component } from '@angular/core';

import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

import { TherapeuticAreaFormComponent } from '../../../shared/components/therapeutic-areas/therapeutic-area-form/therapeutic-area-form.component';


@Component({
    selector: 'app-therapeutic-area-create',
    standalone: true,
    imports: [
        PageBreadcrumbComponent,
        TherapeuticAreaFormComponent
    ],
    template: `
        <app-page-breadcrumb
            pageTitle="Nouveau domaine thérapeutique" />

        <div class="space-y-6">

            <app-therapeutic-area-form />

        </div>
    `
})
export class TherapeuticAreaCreateComponent {
}