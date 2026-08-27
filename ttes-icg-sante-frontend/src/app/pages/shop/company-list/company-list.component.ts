import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { CompanyService } from '../../../core/services/company.service';

@Component({
    selector: 'app-company-list',
    standalone: true,

    imports: [
        CommonModule,
        RouterLink
    ],

    templateUrl: './company-list.component.html'
})
export class CompanyListComponent implements OnInit {

    private companyService = inject(CompanyService);

    companies: any[] = [];

    loading = true;

    error = '';


    ngOnInit(): void {

        this.loadCompanies();

    }


    loadCompanies(): void {

        this.loading = true;

        this.error = '';

        this.companyService
            .getCompanies()
            .subscribe({

                next: (companies) => {

                    console.log(
                        'Entreprises :',
                        companies
                    );

                    this.companies = companies;

                    this.loading = false;

                },

                error: (error) => {

                    console.error(
                        'Erreur chargement entreprises :',
                        error
                    );

                    this.error =
                        error?.error?.message ??
                        'Impossible de charger les entreprises.';

                    this.loading = false;

                }

            });

    }

}