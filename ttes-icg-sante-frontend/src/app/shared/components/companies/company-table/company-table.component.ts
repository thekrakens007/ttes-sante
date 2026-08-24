import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AdminService } from '../../../../core/services/admin.service';
import { CompanyResponse } from '../../../../core/interfaces/company-response.interface';

@Component({
    selector: 'app-company-table',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule
    ],
    templateUrl: './company-table.component.html',
    styles: ``
})
export class CompanyTableComponent implements OnInit {

    private adminService = inject(AdminService);

    companies: CompanyResponse[] = [];

    loading = false;

    errorMessage = '';

    ngOnInit(): void {
        this.loadCompanies();
    }

    loadCompanies(): void {

        this.loading = true;
        this.errorMessage = '';

        this.adminService.getCompanies().subscribe({

            next: data => {

                this.companies = data;

                this.loading = false;

            },

            error: error => {

                console.error(
                    'Erreur chargement entreprises :',
                    error
                );

                this.errorMessage =
                    'Impossible de charger les entreprises.';

                this.loading = false;

            }

        });

    }

    refresh(): void {
        this.loadCompanies();
    }

    deleteCompany(company: CompanyResponse): void {

        const confirmed = confirm(
            `Voulez-vous vraiment supprimer l'entreprise "${company.name}" ?`
        );

        if (!confirmed) {
            return;
        }

        this.adminService
            .deleteCompany(company.id)
            .subscribe({

                next: () => {

                    this.companies =
                        this.companies.filter(
                            item => item.id !== company.id
                        );

                },

                error: error => {

                    console.error(
                        'Erreur suppression entreprise :',
                        error
                    );

                    this.errorMessage =
                        'Impossible de supprimer cette entreprise.';

                }

            });

    }

}