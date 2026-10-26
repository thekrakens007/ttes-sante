import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { CureService } from '../../../../core/services/cure.service';
import { Cure, CureProduct } from '../../../../core/models/cure.model';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';
import { Cart } from '../../../../core/interfaces/cart.interface';

type SortOption = '' | 'price-asc' | 'price-desc' | 'name';

@Component({
    selector: 'app-cure-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './cure-list.component.html'
})
export class CureListComponent implements OnInit {

    // ============================================================
    // SERVICES
    // ============================================================

    private cureService = inject(CureService);
    private authService = inject(AuthService);
    private cartService = inject(CartService);
    private router = inject(Router);


    // ============================================================
    // GENERAL
    // ============================================================

    currentYear = new Date().getFullYear();
    mobileMenuOpen = false;


    // ============================================================
    // PANIER (compteur du header uniquement)
    // ============================================================

    cart: Cart | null = null;
    cartCount = 0;

    /** Cure en cours d'ajout au panier. */
    addingCureId: number | null = null;

    cartMessage = '';
    cartError = '';

    stockDialogOpen = false;
    stockDialogMessage = '';


    // ============================================================
    // CURES
    // ============================================================

    cures: Cure[] = [];
    filteredCures: Cure[] = [];

    /**
     * Cure dont le contenu (liste des produits) est déplié.
     */
    expandedCureId: number | null = null;


    // ============================================================
    // LOADING / ERROR
    // ============================================================

    loading = true;
    error = '';


    // ============================================================
    // RECHERCHE / TRI
    // ============================================================

    searchTerm = '';
    sortOption: SortOption = '';


    // ============================================================
    // PAGINATION
    // ============================================================

    currentPage = 0;
    pageSize = 12;
    totalPages = 0;
    pages: number[] = [];


    // ============================================================
    // INIT
    // ============================================================

    ngOnInit(): void {
        this.loadCures();
        this.loadCart();
    }


    // ============================================================
    // MENU MOBILE
    // ============================================================

    toggleMobileMenu(): void {
        this.mobileMenuOpen = !this.mobileMenuOpen;
    }

    closeMobileMenu(): void {
        this.mobileMenuOpen = false;
    }


    // ============================================================
    // AUTHENTIFICATION
    // ============================================================

    isLoggedIn(): boolean {
        return this.authService.isLoggedIn();
    }

    isAdmin(): boolean {
        if (!this.isLoggedIn()) {
            return false;
        }

        return this.authService.hasRole('ROLE_ADMIN');
    }

    private showStockDialog(message: string): void {
        this.stockDialogMessage = message;
        this.stockDialogOpen = true;
        this.cartError = '';
        this.cartMessage = '';
    }

    closeStockDialog(): void {
        this.stockDialogOpen = false;
    }

    // ============================================================
    // PANIER
    // ============================================================

    loadCart(): void {
        if (!this.authService.isLoggedIn()) {
            this.cart = null;
            this.cartCount = 0;
            return;
        }

        this.cartService.getCart().subscribe({
            next: (cart: Cart) => {
                this.cart = cart;
                this.cartCount = (cart.items ?? []).reduce(
                    (total, item) => total + (item.quantity ?? 0),
                    0
                );
            },
            error: (error: unknown) => {
                console.error('Erreur chargement panier :', error);
                this.cart = null;
                this.cartCount = 0;
            }
        });
    }


    // ============================================================
    // CHARGEMENT DES CURES
    // ============================================================

    loadCures(): void {
        this.loading = true;
        this.error = '';

        this.cureService.getCures().subscribe({
            next: (cures) => {
                // L'endpoint public renvoie déjà les cures publiques ;
                // ce filtre n'est qu'une sécurité supplémentaire.
                this.cures = (cures ?? []).filter(cure => cure.active !== false);
                this.expandedCureId = null;
                this.applyFilters();
                this.loading = false;
            },
            error: (error) => {
                console.error('Erreur chargement cures :', error);

                this.cures = [];
                this.filteredCures = [];
                this.pages = [];
                this.totalPages = 0;

                this.error =
                    error?.error?.message ??
                    'Impossible de charger les cures.';

                this.loading = false;
            }
        });
    }


    // ============================================================
    // RECHERCHE / TRI
    // ============================================================

    private normalize(value: unknown): string {
        if (value === null || value === undefined) {
            return '';
        }

        return String(value)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    search(): void {
        this.currentPage = 0;
        this.applyFilters();
    }

    applyFilters(): void {
        const term = this.normalize(this.searchTerm);

        let result = this.cures.filter(cure => {
            if (!term) {
                return true;
            }

            const text = this.normalize(
                [
                    cure.name,
                    cure.description ?? '',
                    ...(cure.items ?? []).map(item => item.productName)
                ].join(' ')
            );

            return text.includes(term);
        });

        switch (this.sortOption) {
            case 'price-asc':
                result = [...result].sort(
                    (a, b) => (a.totalPrice ?? 0) - (b.totalPrice ?? 0)
                );
                break;

            case 'price-desc':
                result = [...result].sort(
                    (a, b) => (b.totalPrice ?? 0) - (a.totalPrice ?? 0)
                );
                break;

            case 'name':
                result = [...result].sort(
                    (a, b) => a.name.localeCompare(b.name, 'fr')
                );
                break;
        }

        this.filteredCures = result;
        this.updatePagination();
    }

    clearSearch(): void {
        this.searchTerm = '';
        this.search();
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.sortOption = '';
        this.search();
    }


    // ============================================================
    // PAGINATION
    // ============================================================

    updatePagination(): void {
        this.totalPages = Math.ceil(
            this.filteredCures.length / this.pageSize
        );

        if (this.totalPages === 0) {
            this.pages = [];
            this.currentPage = 0;
            return;
        }

        this.pages = Array.from(
            { length: this.totalPages },
            (_, index) => index
        );

        if (this.currentPage >= this.totalPages) {
            this.currentPage = this.totalPages - 1;
        }
    }

    get paginatedCures(): Cure[] {
        const start = this.currentPage * this.pageSize;

        return this.filteredCures.slice(
            start,
            start + this.pageSize
        );
    }

    goToPage(page: number): void {
        if (
            page < 0 ||
            page >= this.totalPages ||
            page === this.currentPage
        ) {
            return;
        }

        this.currentPage = page;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    nextPage(): void {
        this.goToPage(this.currentPage + 1);
    }

    previousPage(): void {
        this.goToPage(this.currentPage - 1);
    }


    // ============================================================
    // CONTENU D'UNE CURE
    // ============================================================

    isExpanded(cure: Cure): boolean {
        return cure.id !== undefined && this.expandedCureId === cure.id;
    }

    toggleContent(cure: Cure): void {
        if (cure.id === undefined) {
            return;
        }

        this.expandedCureId =
            this.expandedCureId === cure.id
                ? null
                : cure.id;
    }

    getItems(cure: Cure): CureProduct[] {
        return cure.items ?? [];
    }

    getProductCount(cure: Cure): number {
        return cure.items?.length ?? 0;
    }


    // ============================================================
    // IMAGE
    // ============================================================

    getMainImage(cure: Cure): string {
        if (cure.imageUrl) {
            return cure.imageUrl;
        }

        return (
            (cure.items ?? []).find(item => item.productImageUrl)
                ?.productImageUrl ??
            '/images/products/default-product.png'
        );
    }


    // ============================================================
    // AJOUT AU PANIER
    // ============================================================

    private applyCart(cart: Cart): void {
        this.cart = cart;
        this.cartCount = (cart.items ?? []).reduce(
            (total, item) => total + (item.quantity ?? 0),
            0
        );
    }

    getCureCartQuantity(cureId?: number): number {
        if (cureId === undefined || !this.cart?.items) {
            return 0;
        }

        return this.cart.items.find(item => item.cureId === cureId)
            ?.quantity ?? 0;
    }

    /**
     * Une cure n'a pas de stock propre : le backend peut fournir
     * availableStock (nombre de cures réalisables avec le stock des
     * produits). S'il est absent, on ne bloque pas côté client.
     */
    isOutOfStock(cure: Cure): boolean {
        return (
            cure.availableStock !== undefined &&
            cure.availableStock !== null &&
            cure.availableStock <= 0
        );
    }

    addToCart(cure: Cure): void {
        if (cure.id === undefined) {
            return;
        }

        // Non connecté : redirection vers la connexion
        if (!this.authService.isLoggedIn()) {
            this.router.navigate(['/signin'], {
                queryParams: { returnUrl: this.router.url }
            });
            return;
        }

        if (this.isOutOfStock(cure)) {
            this.showCartError('Cette cure est actuellement en rupture de stock.');
            return;
        }

        // Éviter le double clic
        if (this.addingCureId !== null) {
            return;
        }

        this.addingCureId = cure.id;
        this.cartMessage = '';
        this.cartError = '';

        this.cartService.addCure(cure.id, 1).subscribe({
            next: (cart: Cart) => {
                this.applyCart(cart);
                this.addingCureId = null;
                this.cartMessage = `${cure.name} a été ajoutée au panier.`;

                setTimeout(() => {
                    this.cartMessage = '';
                }, 3000);
            },
            error: (error: any) => {
                console.error('Erreur ajout cure au panier :', error);
                this.addingCureId = null;

                // Session expirée
                if (error?.status === 401) {
                    this.authService.logout();
                    this.router.navigate(['/signin'], {
                        queryParams: { returnUrl: this.router.url }
                    });
                    return;
                }

                const message =
                    error?.error?.message ??
                    error?.error?.error ??
                    'Impossible d’ajouter la cure au panier.';

                const messageLower = String(message).toLowerCase();

                // Afficher une boîte de dialogue si le problème concerne le stock.
                if (
                    messageLower.includes('stock') ||
                    messageLower.includes('quantité disponible') ||
                    messageLower.includes('quantite disponible') ||
                    messageLower.includes('insuffisant')
                ) {
                    this.showStockDialog(message);
                    return;
                }

                // Les autres erreurs restent affichées comme auparavant.
                this.showCartError(message);
            }
        });
    }

    private showCartError(message: string): void {
        this.cartError = message;
        this.cartMessage = '';

        setTimeout(() => {
            this.cartError = '';
        }, 4000);
    }


    // ============================================================
    // PRIX
    // ============================================================

    formatPrice(price?: number | null): string {
        return (
            new Intl.NumberFormat('fr-FR').format(price ?? 0) +
            ' FCFA'
        );
    }
}