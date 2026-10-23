import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    ActivatedRoute,
    RouterLink
} from '@angular/router';

import { CompanyService } from '../../../core/services/company.service';
import { CompanyResponse } from '../../../core/interfaces/company-response.interface';

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
    private route = inject(ActivatedRoute);

    companies: CompanyResponse[] = [];
    filteredCompanies: CompanyResponse[] = [];

    categoryId: number | null = null;
    categoryName = '';

    loading = true;
    error = '';
    failedLogoIds = new Set<number>();

    ngOnInit(): void {
        this.route.queryParamMap.subscribe(params => {
            const value = params.get('categoryId');

            this.categoryId = value ? Number(value) : null;

            this.loadCompanies();
        });
    }

    loadCompanies(): void {
        this.loading = true;
        this.error = '';

        this.companyService.getCompanies().subscribe({
            next: (companies) => {
                this.companies = companies;
                this.failedLogoIds.clear();

                if (this.categoryId !== null) {
                    this.filteredCompanies = companies.filter(
                        company => company.categoryId === this.categoryId
                    );

                    this.categoryName =
                        this.filteredCompanies.find(
                            company => company.categoryName
                        )?.categoryName || 'Catégorie sélectionnée';
                } else {
                    this.filteredCompanies = companies;
                    this.categoryName = '';
                }

                this.loading = false;
            },

            error: (error) => {
                console.error('Erreur chargement entreprises :', error);

                this.error =
                    error?.error?.message ??
                    'Impossible de charger les entreprises.';

                this.loading = false;
            }
        });
    }

    onLogoError(companyId: number): void {
        this.failedLogoIds.add(companyId);
    }

    getCompanyInitials(name: string): string {
        return name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase();
    }
}
