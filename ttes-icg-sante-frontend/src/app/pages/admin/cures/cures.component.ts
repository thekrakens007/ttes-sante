
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CureService } from '../../../core/services/cure.service';
import { Cure } from '../../../core/models/cure.model';

type StatusFilter = 'all' | 'active' | 'inactive';

interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

@Component({
    selector: 'app-cures',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './cures.component.html'
})
export class CuresComponent implements OnInit {

    private readonly cureService = inject(CureService);

    // DONNÉES
    cures: Cure[] = [];
    filteredCures: Cure[] = [];
    paginatedCures: Cure[] = [];

    loading = false;
    errorMessage = '';
    successMessage = '';

    deletingCureId: number | null = null;

    // FILTRES
    searchTerm = '';
    statusFilter: StatusFilter = 'all';

    // PAGINATION BACKEND
    currentPage = 1;
    pageSize = 9;
    pageSizeOptions = [6, 9, 12, 24];

    totalItems = 0;
    totalPages = 0;
    pages: number[] = [];

    get paginationStart(): number {
        if (this.totalItems === 0) {
            return 0;
        }

        return (this.currentPage - 1) * this.pageSize + 1;
    }

    get paginationEnd(): number {
        return Math.min(
            this.currentPage * this.pageSize,
            this.totalItems
        );
    }

    // INITIALISATION
    ngOnInit(): void {
        this.loadCures();
    }

    loadCures(): void {
        this.loading = true;
        this.errorMessage = '';

        this.cureService.getAdminCures(
            this.currentPage - 1,
            this.pageSize
        ).subscribe({
            next: (response: PageResponse<Cure>) => {
                this.cures = response.content ?? [];

                this.totalItems = response.totalElements ?? 0;
                this.totalPages = response.totalPages ?? 0;

                this.currentPage = response.number + 1;

                this.applyFilters();
                this.loading = false;
            },
            error: (error) => {
                console.error('Erreur de chargement des cures', error);

                this.errorMessage = 'Impossible de charger les cures.';
                this.loading = false;
            }
        });
    }

    // RECHERCHE ET FILTRES
    onSearch(): void {
        this.applyFilters();
    }

    clearSearch(): void {
        this.searchTerm = '';
        this.applyFilters();
    }

    onStatusFilterChange(): void {
        this.applyFilters();
    }

    onPageSizeChange(): void {
        this.currentPage = 1;
        this.loadCures();
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.statusFilter = 'all';
        this.currentPage = 1;
        this.loadCures();
    }

    applyFilters(): void {
        const term = this.normalize(this.searchTerm);

        this.filteredCures = this.cures.filter(cure => {

            if (this.statusFilter === 'active' && !cure.active) {
                return false;
            }

            if (this.statusFilter === 'inactive' && cure.active) {
                return false;
            }

            if (term) {
                const haystack = this.normalize(
                    [
                        cure.name,
                        cure.description ?? '',
                        cure.type ?? ''
                    ].join(' ')
                );

                if (!haystack.includes(term)) {
                    return false;
                }
            }

            return true;
        });

        // Le backend fournit déjà la page demandée.
        this.paginatedCures = [...this.filteredCures];

        this.buildPages();
    }

    private normalize(value: string): string {
        return (value ?? '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    // PAGINATION
    private buildPages(): void {
        this.pages = Array.from(
            { length: this.totalPages },
            (_, index) => index + 1
        );
    }

    previousPage(): void {
        this.goToPage(this.currentPage - 1);
    }

    nextPage(): void {
        this.goToPage(this.currentPage + 1);
    }

    goToPage(page: number): void {
        if (
            page < 1 ||
            page > this.totalPages ||
            page === this.currentPage
        ) {
            return;
        }

        this.currentPage = page;
        this.loadCures();
    }

    // SUPPRESSION
    deleteCure(cure: Cure): void {
        if (!cure.id) {
            return;
        }

        const confirmed = window.confirm(
            `Voulez-vous vraiment désactiver la cure « ${cure.name} » ?`
        );

        if (!confirmed) {
            return;
        }

        this.errorMessage = '';
        this.successMessage = '';
        this.deletingCureId = cure.id;

        this.cureService.deleteCure(cure.id).subscribe({
            next: () => {
                this.deletingCureId = null;
                this.successMessage = 'Cure désactivée avec succès.';

                // Recharge la page pour actualiser les données.
                this.loadCures();
            },
            error: (error) => {
                console.error('Erreur de suppression', error);

                this.deletingCureId = null;

                this.errorMessage =
                    error?.error?.message ??
                    'La désactivation de la cure a échoué.';
            }
        });
    }

    // AFFICHAGE
    getMainImage(cure: Cure): string {
        return cure.imageUrl ?? '';
    }

    formatPrice(price?: number | null): string {
        return `${(price ?? 0).toLocaleString('fr-FR')} FCFA`;
    }

    getTypeLabel(type: string): string {
        switch (type) {
            case 'PREVENTIVE':
                return 'Préventive';
            case 'CURATIVE':
                return 'Curative';
            default:
                return type;
        }
    }
}
