
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { BundleService } from '../../../core/services/bundle.service';
import { BundleResponse } from '../../../core/interfaces/bundle-response.interface';
@Component({
    selector: 'app-bundles',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink
    ],
    templateUrl: './bundles.component.html'
})
export class BundlesComponent implements OnInit {

    bundles: BundleResponse[] = [];
    filteredBundles: BundleResponse[] = [];

    loading = true;
    error = '';
    deletingBundleId: number | null = null;

    searchTerm = '';

    statusFilter: 'all' | 'active' | 'inactive' = 'all';
    stockFilter: 'all' | 'available' | 'low' | 'out' = 'all';

    // Pagination gérée par le backend
    currentPage = 1;
    pageSize = 9;
    pageSizeOptions = [6, 9, 12, 24];

    totalItems = 0;
    totalPages = 0;

    constructor(private bundleService: BundleService) {}

    ngOnInit(): void {
        this.loadBundles();
    }

    /**
     * Charge les packs depuis le backend.
     * Le backend utilise une pagination commençant à 0.
     */
    loadBundles(): void {
        this.loading = true;
        this.error = '';

        this.bundleService
            .getAdminBundles(this.currentPage - 1, this.pageSize)
            .subscribe({
                next: (response) => {
                    this.totalItems = response.totalElements ?? 0;
                    this.totalPages = response.totalPages ?? 0;

                    // Si la page demandée n'existe plus,
                    // revenir à la dernière page disponible.
                    if (this.totalPages > 0 && this.currentPage > this.totalPages) {
                        this.currentPage = this.totalPages;
                        this.loadBundles();
                        return;
                    }

                    if (this.totalPages === 0) {
                        this.currentPage = 1;
                    }

                    this.bundles = response.content ?? [];

                    this.applyFilters();
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Erreur lors du chargement des packs :', err);

                    this.bundles = [];
                    this.filteredBundles = [];
                    this.totalItems = 0;
                    this.totalPages = 0;
                    this.loading = false;

                    this.error = 'Impossible de charger les packs.';
                }
            });
    }

    /**
     * Recherche sur les packs de la page chargée.
     */
    onSearch(): void {
        this.resetPageAndApplyFilters();
    }

    clearSearch(): void {
        this.searchTerm = '';
        this.resetPageAndApplyFilters();
    }

    /**
     * Filtre par statut.
     */
    onStatusFilterChange(): void {
        this.resetPageAndApplyFilters();
    }

    /**
     * Filtre par stock.
     */
    onStockFilterChange(): void {
        this.resetPageAndApplyFilters();
    }

    /**
     * Revient à la première page lorsque les filtres changent.
     * Évite de refaire un appel HTTP à chaque frappe si on est
     * déjà sur la première page.
     */
    private resetPageAndApplyFilters(): void {
        if (this.currentPage !== 1) {
            this.currentPage = 1;
            this.loadBundles();
        } else {
            this.applyFilters();
        }
    }

    /**
     * Applique les filtres localement aux éléments de la page actuelle.
     */
    applyFilters(): void {
        let result = [...this.bundles];

        const search = this.normalizeSearchText(this.searchTerm);

        if (search) {
            result = result.filter(bundle =>
                this.matchesSearch(bundle, search)
            );
        }

        if (this.statusFilter === 'active') {
            result = result.filter(bundle => this.isActive(bundle));
        } else if (this.statusFilter === 'inactive') {
            result = result.filter(bundle => !this.isActive(bundle));
        }

        if (this.stockFilter !== 'all') {
            result = result.filter(bundle => {
                const stock = this.getStock(bundle);

                switch (this.stockFilter) {
                    case 'available':
                        return stock > 5;

                    case 'low':
                        return stock > 0 && stock <= 5;

                    case 'out':
                        return stock <= 0;

                    default:
                        return true;
                }
            });
        }

        this.filteredBundles = result;
    }

    /**
     * Recherche textuelle avec normalisation des accents.
     */
    private matchesSearch(bundle: BundleResponse, search: string): boolean {
        const item = bundle as any;

        const values: unknown[] = [
            item.id,
            item.name,
            item.description,
            item.price,
            item.stock,
            item.quantity,
            item.active,

            ...(Array.isArray(item.products)
                ? item.products.flatMap((product: any) => [
                    product.id,
                    product.name,
                    product.sku,
                    product.description,
                    product.brand,
                    product.activeIngredient,
                    product.dosage,
                    product.form,
                    product.ingredients,
                    product.companyName,
                    product.companyId,
                    product.price,
                    product.stock,
                    product.quantity,
                    product.categories,
                    product.categoryNames,
                    product.therapeuticAreas,
                    product.therapeuticAreaNames
                ])
                : []),

            ...(Array.isArray(item.items)
                ? item.items.flatMap((entry: any) => {
                    const product = entry.product ?? entry;

                    return [
                        product.id,
                        product.name,
                        product.sku,
                        product.description,
                        product.brand,
                        product.activeIngredient,
                        product.dosage,
                        product.form,
                        product.ingredients,
                        product.companyName,
                        product.companyId,
                        product.categories,
                        product.categoryNames,
                        product.therapeuticAreas,
                        product.therapeuticAreaNames
                    ];
                })
                : [])
        ];

        return values.some(value =>
            this.normalizeSearchText(String(value ?? '')).includes(search)
        );
    }

    /**
     * Supprime les accents et normalise le texte.
     */
    private normalizeSearchText(value: string): string {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    /**
     * Vérifie si le pack est actif.
     */
    private isActive(bundle: BundleResponse): boolean {
        return Boolean((bundle as any).active);
    }

    /**
     * Récupère le stock du pack.
     */
    private getStock(bundle: BundleResponse): number {
        const stock = Number((bundle as any).stock ?? 0);
        return Number.isFinite(stock) ? stock : 0;
    }

    /**
     * Pagination : pages disponibles.
     */
    get pages(): number[] {
        return Array.from(
            { length: this.totalPages },
            (_, index) => index + 1
        );
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
        this.loadBundles();
        this.scrollToTop();
    }

    previousPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadBundles();
            this.scrollToTop();
        }
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadBundles();
            this.scrollToTop();
        }
    }

    onPageSizeChange(): void {
        this.currentPage = 1;
        this.loadBundles();
    }

    /**
     * Première ligne affichée dans la pagination.
     */
    get paginationStart(): number {
        if (this.totalItems === 0) {
            return 0;
        }

        return (this.currentPage - 1) * this.pageSize + 1;
    }

    /**
     * Dernière ligne affichée dans la pagination.
     */
    get paginationEnd(): number {
        return Math.min(
            this.currentPage * this.pageSize,
            this.totalItems
        );
    }

    private scrollToTop(): void {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    /**
     * Formatage du prix.
     */
    formatPrice(price: number | null | undefined): string {
        return new Intl.NumberFormat('fr-FR').format(price ?? 0);
    }

    /**
     * Récupération de l'image principale.
     */
    getMainImage(bundle: BundleResponse): string {
        const item = bundle as any;

        return (
            item.imageUrl ||
            item.image ||
            item.products?.[0]?.imageUrl ||
            item.items?.[0]?.product?.imageUrl ||
            'assets/images/default-product.png'
        );
    }

    /**
     * Nombre de produits dans le pack.
     */
    getProductCount(bundle: BundleResponse): number {
        const item = bundle as any;

        if (Array.isArray(item.products)) {
            return item.products.length;
        }

        if (Array.isArray(item.items)) {
            return item.items.length;
        }

        return 0;
    }

    /**
     * Classe CSS correspondant au stock.
     */
    getStockClass(stock: number): string {
        if (stock <= 0) {
            return 'text-red-600 bg-red-100';
        }

        if (stock <= 5) {
            return 'text-orange-600 bg-orange-100';
        }

        return 'text-green-600 bg-green-100';
    }

    /**
     * Libellé correspondant au stock.
     */
    getStockLabel(stock: number): string {
        if (stock <= 0) {
            return 'Rupture de stock';
        }

        if (stock <= 5) {
            return 'Stock faible';
        }

        return 'Disponible';
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.statusFilter = 'all';
        this.stockFilter = 'all';

        if (this.currentPage !== 1) {
            this.currentPage = 1;
            this.loadBundles();
        } else {
            this.applyFilters();
        }
    }
    /**
     * Suppression d'un pack.
     */
    deleteBundle(bundle: BundleResponse): void {
        const item = bundle as any;

        if (!confirm(`Voulez-vous vraiment supprimer le pack "${item.name}" ?`)) {
            return;
        }

        this.deletingBundleId = item.id;

        this.bundleService.deleteBundle(item.id).subscribe({
            next: () => {
                this.deletingBundleId = null;

                // Recharger les données depuis le backend
                // pour actualiser correctement la pagination.
                this.loadBundles();
            },
            error: (err) => {
                console.error('Erreur lors de la suppression du pack :', err);

                this.deletingBundleId = null;

                alert('Une erreur est survenue lors de la suppression du pack.');
            }
        });
    }
}
