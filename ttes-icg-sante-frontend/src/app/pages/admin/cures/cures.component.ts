import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CureService } from '../../../core/services/cure.service';
import { Cure } from '../../../core/models/cure.model';

type StatusFilter = 'all' | 'active' | 'inactive';

@Component({
    selector: 'app-cures',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './cures.component.html'
})
export class CuresComponent implements OnInit {
    private readonly cureService = inject(CureService);

    // ============================================================
    // DONNEES
    // ============================================================

    cures: Cure[] = [];
    filteredCures: Cure[] = [];
    paginatedCures: Cure[] = [];

    loading = false;
    errorMessage = '';
    successMessage = '';

    deletingCureId: number | null = null;

    // ============================================================
    // FILTRES
    // ============================================================

    searchTerm = '';
    statusFilter: StatusFilter = 'all';

    // ============================================================
    // PAGINATION (côté client, pages numérotées à partir de 1)
    // ============================================================

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

    // ============================================================
    // INITIALISATION
    // ============================================================

    ngOnInit(): void {
        this.loadCures();
    }

    loadCures(): void {
        this.loading = true;
        this.errorMessage = '';

        this.cureService.getAdminCures().subscribe({
            next: (cures) => {
                this.cures = cures ?? [];
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

    // ============================================================
    // RECHERCHE / FILTRES
    // ============================================================

    onSearch(): void {
        this.currentPage = 1;
        this.applyFilters();
    }

    clearSearch(): void {
        this.searchTerm = '';
        this.onSearch();
    }

    onStatusFilterChange(): void {
        this.currentPage = 1;
        this.applyFilters();
    }

    onPageSizeChange(): void {
        this.currentPage = 1;
        this.applyFilters();
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.statusFilter = 'all';
        this.currentPage = 1;
        this.applyFilters();
    }

    applyFilters(): void {
        const term = this.normalize(this.searchTerm);

        this.filteredCures = this.cures.filter(cure => {
            // Statut
            if (this.statusFilter === 'active' && !cure.active) {
                return false;
            }

            if (this.statusFilter === 'inactive' && cure.active) {
                return false;
            }

            // Recherche : nom, description, produits de la cure
            if (term) {
                const haystack = this.normalize(
                    [
                        cure.name,
                        cure.description ?? '',
                        ...(cure.items ?? []).map(item => item.productName)
                    ].join(' ')
                );

                if (!haystack.includes(term)) {
                    return false;
                }
            }

            return true;
        });

        this.totalItems = this.filteredCures.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);

        // Si la page courante n'existe plus (suppression, filtre...), on la ramène.
        if (this.currentPage > this.totalPages) {
            this.currentPage = Math.max(1, this.totalPages);
        }

        this.buildPages();
        this.updatePaginatedCures();
    }

    private normalize(value: string): string {
        return (value ?? '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    // ============================================================
    // PAGINATION
    // ============================================================

    private buildPages(): void {
        this.pages = Array.from(
            { length: this.totalPages },
            (_, index) => index + 1
        );
    }

    private updatePaginatedCures(): void {
        const start = (this.currentPage - 1) * this.pageSize;

        this.paginatedCures = this.filteredCures.slice(
            start,
            start + this.pageSize
        );
    }

    previousPage(): void {
        this.goToPage(this.currentPage - 1);
    }

    nextPage(): void {
        this.goToPage(this.currentPage + 1);
    }

    goToPage(page: number): void {
        if (page < 1 || page > this.totalPages) {
            return;
        }

        this.currentPage = page;
        this.updatePaginatedCures();
    }

    // ============================================================
    // SUPPRESSION
    // ============================================================

    deleteCure(cure: Cure): void {
        if (!cure.id) {
            return;
        }

        const confirmed = window.confirm(
            `Voulez-vous vraiment supprimer la cure « ${cure.name} » ?`
        );

        if (!confirmed) {
            return;
        }

        this.errorMessage = '';
        this.successMessage = '';
        this.deletingCureId = cure.id;

        this.cureService.deleteCure(cure.id).subscribe({
            next: () => {
                this.cures = this.cures.filter(item => item.id !== cure.id);
                this.deletingCureId = null;
                this.successMessage = 'Cure supprimée avec succès.';
                this.applyFilters();
            },
            error: (error) => {
                console.error('Erreur de suppression', error);
                this.deletingCureId = null;
                this.errorMessage =
                    error?.error?.message ??
                    'La suppression de la cure a échoué.';
            }
        });
    }

    // ============================================================
    // AFFICHAGE
    // ============================================================

    getMainImage(cure: Cure): string {
        if (cure.imageUrl) {
            return cure.imageUrl;
        }

        // À défaut, on utilise l'image du premier produit de la cure.
        return (cure.items ?? []).find(item => item.productImageUrl)
            ?.productImageUrl ?? '';
    }

    getProductCount(cure: Cure): number {
        return cure.items?.length ?? 0;
    }

    getTotalQuantity(cure: Cure): number {
        return (cure.items ?? []).reduce(
            (total, item) => total + (item.quantity ?? 0),
            0
        );
    }

    formatPrice(price?: number | null): string {
        return `${(price ?? 0).toLocaleString('fr-FR')} FCFA`;
    }
}