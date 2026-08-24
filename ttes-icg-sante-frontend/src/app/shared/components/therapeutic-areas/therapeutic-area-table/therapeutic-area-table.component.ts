import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { BadgeComponent } from '../../ui/badge/badge.component';

import { AdminService } from '../../../../core/services/admin.service';
import { TherapeuticAreaResponse } from '../../../../core/interfaces/therapeutic-area-response.interface';

@Component({
    selector: 'app-therapeutic-area-table',
    standalone: true,
    imports: [
        RouterModule,
        BadgeComponent
    ],
    templateUrl: './therapeutic-area-table.component.html',
    styles: ``
})
export class TherapeuticAreaTableComponent implements OnInit {

    private adminService = inject(AdminService);

    therapeuticAreas: TherapeuticAreaResponse[] = [];

    loading = false;

    errorMessage = '';


    ngOnInit(): void {

        this.loadTherapeuticAreas();

    }


    // ==========================================
    // CHARGER LES DOMAINES
    // ==========================================

    loadTherapeuticAreas(): void {

        this.loading = true;
        this.errorMessage = '';

        this.adminService
            .getTherapeuticAreas()
            .subscribe({

                next: (data) => {

                    this.therapeuticAreas = data;

                    this.loading = false;

                },

                error: (error) => {

                    console.error(
                        'Erreur chargement domaines thérapeutiques :',
                        error
                    );

                    this.errorMessage =
                        'Impossible de charger les domaines thérapeutiques.';

                    this.loading = false;

                }

            });

    }


    // ==========================================
    // SUPPRIMER
    // ==========================================

    deleteTherapeuticArea(
        area: TherapeuticAreaResponse
    ): void {

        const confirmed = confirm(
            `Voulez-vous vraiment supprimer le domaine "${area.name}" ?`
        );

        if (!confirmed) {
            return;
        }

        this.adminService
            .deleteTherapeuticArea(area.id)
            .subscribe({

                next: () => {

                    this.therapeuticAreas =
                        this.therapeuticAreas.filter(
                            item => item.id !== area.id
                        );

                },

                error: (error) => {

                    console.error(
                        'Erreur suppression domaine thérapeutique :',
                        error
                    );

                    this.errorMessage =
                        'Impossible de supprimer le domaine thérapeutique.';

                }

            });

    }


    // ==========================================
    // COULEUR DU BADGE
    // ==========================================

    getStatusColor(
        active: boolean | undefined
    ): 'success' | 'error' {

        return active
            ? 'success'
            : 'error';

    }


    // ==========================================
    // LABEL DU STATUT
    // ==========================================

    getStatusLabel(
        active: boolean | undefined
    ): string {

        return active
            ? 'Actif'
            : 'Inactif';

    }

}