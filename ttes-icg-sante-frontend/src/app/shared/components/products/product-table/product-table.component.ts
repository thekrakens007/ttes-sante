import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { BadgeComponent } from '../../ui/badge/badge.component';
import { AdminService } from '../../../../core/services/admin.service';
import { Product } from '../../../../core/models/product.model';

@Component({
    selector: 'app-product-table',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        BadgeComponent,
        RouterModule
    ],
    templateUrl: './product-table.component.html'
})
export class ProductTableComponent implements OnInit {

    private adminService = inject(AdminService);
    private router = inject(Router);

    products: Product[] = [];

    loading = true;
    errorMessage = '';

    searchTerm = '';

    currentPage = 0;
    pageSize = 8;

    totalPages = 0;
    totalElements = 0;

    pages: number[] = [];

    /**
     * Produits sélectionnés pour créer un pack.
     *
     * IMPORTANT :
     * Cette sélection est indépendante de la page courante.
     * Donc elle reste conservée lors :
     * - de la pagination
     * - d'une recherche
     * - du changement de page
     */
    selectedProductIds = new Set<number>();

    ngOnInit(): void {
        this.loadProducts();
    }

    /**
     * Nombre de produits actuellement sélectionnés.
     */
    get selectedProductCount(): number {
        return this.selectedProductIds.size;
    }

    /**
     * Charge les produits.
     */
    loadProducts(): void {
        this.loading = true;
        this.errorMessage = '';

        const keyword = this.searchTerm.trim();

        const request = keyword
            ? this.adminService.searchProductsPaginated(
                keyword,
                this.currentPage,
                this.pageSize
            )
            : this.adminService.getProductsPaginated(
                this.currentPage,
                this.pageSize
            );

        request.subscribe({
            next: (response: any) => {

                this.products = response.content ?? [];

                this.totalPages = response.totalPages ?? 0;
                this.totalElements = response.totalElements ?? 0;

                this.generatePages();

                this.loading = false;
            },

            error: (error) => {
                console.error('Erreur chargement produits :', error);

                this.errorMessage =
                    'Impossible de charger les produits.';

                this.products = [];
                this.loading = false;
            }
        });
    }

    /**
     * Génère les numéros de pages.
     */
    generatePages(): void {
        this.pages = [];

        for (let i = 0; i < this.totalPages; i++) {
            this.pages.push(i);
        }
    }

    /**
     * Recherche.
     *
     * La sélection des produits n'est volontairement PAS vidée ici.
     */
    submitSearch(): void {
        this.currentPage = 0;
        this.loadProducts();
    }

    /**
     * Aller directement à une page.
     */
    goToPage(page: number): void {
        if (
            page < 0 ||
            page >= this.totalPages ||
            page === this.currentPage
        ) {
            return;
        }

        this.currentPage = page;
        this.loadProducts();
    }

    /**
     * Page précédente.
     */
    previousPage(): void {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.loadProducts();
        }
    }

    /**
     * Page suivante.
     */
    nextPage(): void {
        if (this.currentPage < this.totalPages - 1) {
            this.currentPage++;
            this.loadProducts();
        }
    }

    /**
     * Sélectionner / désélectionner un produit.
     */
    toggleProductSelection(productId: number): void {

        if (this.selectedProductIds.has(productId)) {
            this.selectedProductIds.delete(productId);
        } else {
            this.selectedProductIds.add(productId);
        }
    }

    /**
     * Vérifie si un produit est sélectionné.
     */
    isProductSelected(productId: number): boolean {
        return this.selectedProductIds.has(productId);
    }

    /**
     * Vide complètement la sélection.
     */
    clearProductSelection(): void {
        this.selectedProductIds.clear();
    }

    /**
     * Envoie les produits sélectionnés vers le formulaire
     * de création du pack.
     */
    continueToBundleCreation(): void {

        const productIds = Array.from(
            this.selectedProductIds
        );

        if (productIds.length === 0) {
            return;
        }

        this.router.navigate(
            ['/admin/bundles/new'],
            {
                queryParams: {
                    productIds
                }
            }
        );
    }

    /**
     * Supprimer un produit.
     */
    deleteProduct(productId: number): void {

        if (!confirm(
            'Êtes-vous sûr de vouloir supprimer ce produit ?'
        )) {
            return;
        }

        this.adminService.deleteProduct(productId).subscribe({
            next: () => {

                // Si le produit était sélectionné,
                // on le retire également de la sélection.
                this.selectedProductIds.delete(productId);

                this.loadProducts();
            },

            error: (error) => {
                console.error(
                    'Erreur suppression produit :',
                    error
                );

                this.errorMessage =
                    'Impossible de supprimer le produit.';
            }
        });
    }
}
