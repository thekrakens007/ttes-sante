import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';

import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

import { TherapeuticAreaFormComponent } from '../../../shared/components/therapeutic-areas/therapeutic-area-form/therapeutic-area-form.component';


@Component({
    selector: 'app-therapeutic-area-edit',
    standalone: true,
    imports: [
        PageBreadcrumbComponent,
        TherapeuticAreaFormComponent
    ],
    template: `
        <app-page-breadcrumb
            pageTitle="Modifier le domaine thérapeutique" />

        <div class="space-y-6">

            <app-therapeutic-area-form
                [therapeuticAreaId]="therapeuticAreaId" />

        </div>
    `
})
export class TherapeuticAreaEditComponent
    implements OnInit {

    private route = inject(ActivatedRoute);

    therapeuticAreaId!: number;


    ngOnInit(): void {

        this.therapeuticAreaId =
            Number(
                this.route.snapshot.paramMap.get('id')
            );

    }

}