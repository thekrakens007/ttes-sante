import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { CompanyService } from '../../../core/services/company.service';
import { CompanyResponse } from '../../../core/interfaces/company-response.interface';
import { ProductResponse } from '../../../core/interfaces/product-response.interface';

@Component({
    selector: 'app-company-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './company-detail.component.html'
})
export class CompanyDetailComponent implements OnInit {

    private readonly route = inject(ActivatedRoute);
    private readonly companyService = inject(CompanyService);

    company: CompanyResponse | null = null;
    products: ProductResponse[] = [];

    loading = true;
    error = '';
    currentYear = new Date().getFullYear();

    private companyId: number | null = null;

    // Recherche
    searchTerm = '';
    appliedSearchTerm = '';

    // Pagination
    currentPage = 1;
    pageSize = 8;

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');

        if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
            this.error = 'Identifiant de l’entreprise invalide.';
            this.loading = false;
            return;
        }

        this.companyId = Number(id);
        this.loadCompany(this.companyId);
    }

    /**
     * Charge les informations de l'entreprise.
     */
    loadCompany(companyId: number): void {
        this.loading = true;
        this.error = '';
        this.company = null;
        this.products = [];

        this.companyService.getCompany(companyId).subscribe({
            next: (company) => {
                this.company = company;
                this.loadProducts(companyId);
            },
            error: (err) => {
                console.error(
                    'Erreur lors du chargement de l’entreprise :',
                    err
                );

                this.error =
                    err?.error?.message ??
                    'Impossible de charger l’entreprise. Veuillez réessayer.';

                this.loading = false;
            }
        });
    }

    /**
     * Charge les produits de l'entreprise.
     */
    loadProducts(companyId: number): void {
        this.companyService.getCompanyProducts(companyId).subscribe({
            next: (products) => {
                this.products = products ?? [];
                this.currentPage = 1;
                this.loading = false;
            },
            error: (err) => {
                console.error(
                    'Erreur lors du chargement des produits :',
                    err
                );

                // L'entreprise reste consultable même si ses produits
                // ne peuvent pas être chargés.
                this.products = [];
                this.loading = false;
            }
        });
    }

    /**
     * Applique la recherche uniquement après Entrée ou clic.
     */
    submitSearch(): void {
        this.appliedSearchTerm = this.searchTerm.trim().toLocaleLowerCase('fr');
        this.currentPage = 1;
    }

    /**
     * Efface la recherche et réaffiche tous les produits.
     */
    clearSearch(): void {
        this.searchTerm = '';
        this.appliedSearchTerm = '';
        this.currentPage = 1;
    }

    /**
     * Produits correspondant à la recherche.
     * La recherche porte sur le nom, la marque,
     * la description et la référence éventuelle.
     */
    get filteredProducts(): ProductResponse[] {
        if (!this.appliedSearchTerm) {
            return this.products;
        }

        return this.products.filter((product) => {
            const searchableText = [
                product.name,
                product.brand,
                product.description,
                product.sku
            ]
                .filter((value) => value !== null && value !== undefined)
                .join(' ')
                .toLocaleLowerCase('fr');

            return searchableText.includes(this.appliedSearchTerm);
        });
    }

    /**
     * Nombre total de pages.
     */
    get totalPages(): number {
        return Math.ceil(this.filteredProducts.length / this.pageSize);
    }

    /**
     * Produits visibles sur la page actuelle.
     */
    get paginatedProducts(): ProductResponse[] {
        const startIndex = (this.currentPage - 1) * this.pageSize;

        return this.filteredProducts.slice(
            startIndex,
            startIndex + this.pageSize
        );
    }

    /**
     * Numéros des pages à afficher.
     */
    get pageNumbers(): number[] {
        return Array.from(
            { length: this.totalPages },
            (_, index) => index + 1
        );
    }

    /**
     * Première position affichée dans les résultats.
     */
    get firstResult(): number {
        return this.filteredProducts.length === 0
            ? 0
            : (this.currentPage - 1) * this.pageSize + 1;
    }

    /**
     * Dernière position affichée dans les résultats.
     */
    get lastResult(): number {
        return Math.min(
            this.currentPage * this.pageSize,
            this.filteredProducts.length
        );
    }

    goToPage(page: number): void {
        if (page < 1 || page > this.totalPages) {
            return;
        }

        this.currentPage = page;
    }

    previousPage(): void {
        this.goToPage(this.currentPage - 1);
    }

    nextPage(): void {
        this.goToPage(this.currentPage + 1);
    }

    retryLoad(): void {
        if (this.companyId === null) {
            return;
        }

        this.loadCompany(this.companyId);
    }

    formatPrice(price: number | null | undefined): string {
        if (price === null || price === undefined) {
            return '0 FCFA';
        }

        return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
    }
}