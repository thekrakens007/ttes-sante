
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import {
    CureService,
    PageResponse,
    CureType
} from '../../../../core/services/cure.service';

import { Cure } from '../../../../core/models/cure.model';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';
import { Cart } from '../../../../core/interfaces/cart.interface';

type SortOption = '' | 'price-asc' | 'price-desc' | 'name';

@Component({
    selector: 'app-cure-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule
    ],
    templateUrl: './cure-list.component.html'
})
export class CureListComponent implements OnInit {

    private readonly cureService = inject(CureService);
    private readonly authService = inject(AuthService);
    private readonly cartService = inject(CartService);
    private readonly router = inject(Router);

    currentYear = new Date().getFullYear();

    mobileMenuOpen = false;

    // Type sélectionné : PREVENTIVE par défaut
    selectedType: CureType = 'PREVENTIVE';

    // Panier
    cart: Cart | null = null;
    cartCount = 0;
    addingCureId: number | null = null;
    cartMessage = '';
    cartError = '';

    // Cures
    cures: Cure[] = [];
    filteredCures: Cure[] = [];
    paginatedCures: Cure[] = [];

    // Chargement
    loading = true;
    error = '';

    // Recherche et tri
    searchTerm = '';
    sortOption: SortOption = '';

    // Pagination backend
    currentPage = 0;
    pageSize = 8;
    totalPages = 0;
    totalElements = 0;

    ngOnInit(): void {
        this.loadCures();
        this.loadCart();
    }

    // =========================================================
    // NAVIGATION
    // =========================================================

    toggleMobileMenu(): void {
        this.mobileMenuOpen = !this.mobileMenuOpen;
    }

    logout(): void {
        this.authService.logout();
        this.cart = null;
        this.cartCount = 0;
        this.mobileMenuOpen = false;

        this.router.navigate(['/']);
    }

    closeMobileMenu(): void {
        this.mobileMenuOpen = false;
    }

    isLoggedIn(): boolean {
        return this.authService.isLoggedIn();
    }

    isAdmin(): boolean {
        return this.authService.isAdmin();
    }

    // =========================================================
    // SÉLECTION DU TYPE DE CURE
    // =========================================================

    selectType(type: CureType): void {
        if (this.selectedType === type) {
            return;
        }

        this.selectedType = type;

        // Chaque catégorie recommence à la première page
        this.currentPage = 0;

        this.loadCures();
    }

    // =========================================================
    // PANIER
    // =========================================================

    loadCart(): void {
        if (!this.isLoggedIn()) {
            this.cart = null;
            this.cartCount = 0;
            return;
        }

        this.cartService.getCart().subscribe({
            next: (cart: Cart) => {
                this.applyCart(cart);
            },
            error: (err) => {
                console.error('Erreur chargement panier :', err);
            }
        });
    }

    applyCart(cart: Cart): void {
        this.cart = cart;

        this.cartCount = (cart.items ?? []).reduce(
            (total, item) => total + item.quantity,
            0
        );
    }

    getCureCartQuantity(cureId?: number): number {
        if (!cureId || !this.cart?.items) {
            return 0;
        }

        const item = this.cart.items.find(
            item => item.cureId === cureId
        );

        return item?.quantity ?? 0;
    }

    addToCart(cure: Cure): void {
        if (!cure.id || !cure.active) {
            return;
        }

        if (!this.isLoggedIn()) {
            this.router.navigate(['/signin'], {
                queryParams: {
                    returnUrl: this.router.url
                }
            });
            return;
        }

        if (this.addingCureId !== null) {
            return;
        }

        this.addingCureId = cure.id;
        this.cartMessage = '';
        this.cartError = '';

        this.cartService.addCure(cure.id, 1).subscribe({
            next: (cart: Cart) => {
                this.applyCart(cart);
                this.cartMessage = `${cure.name} ajoutée au panier.`;
                this.addingCureId = null;

                setTimeout(() => {
                    this.cartMessage = '';
                }, 4000);
            },
            error: (err) => {
                console.error('Erreur ajout panier :', err);

                this.addingCureId = null;

                if (err.status === 401) {
                    this.cartError = 'Votre session a expiré. Veuillez vous reconnecter.';
                } else {
                    this.cartError =
                        err.error?.message ??
                        "Impossible d'ajouter cette cure au panier.";
                }

                setTimeout(() => {
                    this.cartError = '';
                }, 5000);
            }
        });
    }

    // =========================================================
    // CHARGEMENT DES CURES
    // =========================================================

    loadCures(): void {
        this.loading = true;
        this.error = '';

        this.cureService.getCures(
            this.currentPage,
            this.pageSize,
            this.selectedType
        ).subscribe({
            next: (response: PageResponse<Cure>) => {
                this.cures = response.content ?? [];

                this.totalPages = response.totalPages;
                this.totalElements = response.totalElements;
                this.currentPage = response.number;

                this.applyFilters();

                this.loading = false;
            },
            error: (err) => {
                console.error('Erreur chargement cures :', err);

                this.cures = [];
                this.filteredCures = [];
                this.paginatedCures = [];

                this.totalPages = 0;
                this.totalElements = 0;

                this.error =
                    err.error?.message ??
                    'Impossible de charger les cures. Veuillez réessayer.';

                this.loading = false;
            }
        });
    }

    // =========================================================
    // RECHERCHE ET FILTRAGE
    // =========================================================

    normalize(value: string | null | undefined): string {
        return (value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    search(): void {
        this.applyFilters();
    }

    applyFilters(): void {
        const term = this.normalize(this.searchTerm);

        // Toujours filtrer selon le type sélectionné
        let result = this.cures.filter(cure => {

            const matchesType = cure.type === this.selectedType;

            const matchesSearch =
                !term ||
                this.normalize(cure.name).includes(term) ||
                this.normalize(cure.description).includes(term) ||
                this.normalize(cure.type).includes(term);

            return matchesType && matchesSearch;
        });

        // Tri
        switch (this.sortOption) {
            case 'price-asc':
                result = [...result].sort(
                    (a, b) => Number(a.price) - Number(b.price)
                );
                break;

            case 'price-desc':
                result = [...result].sort(
                    (a, b) => Number(b.price) - Number(a.price)
                );
                break;

            case 'name':
                result = [...result].sort(
                    (a, b) => a.name.localeCompare(b.name)
                );
                break;
        }

        this.filteredCures = result;
        this.paginatedCures = result;
    }

    clearSearch(): void {
        this.searchTerm = '';
        this.applyFilters();
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.sortOption = '';
        this.applyFilters();
    }

    // =========================================================
    // PAGINATION BACKEND
    // =========================================================

    goToPage(page: number): void {
        if (
            page < 0 ||
            page >= this.totalPages ||
            page === this.currentPage
        ) {
            return;
        }

        this.currentPage = page;
        this.loadCures();

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages - 1) {
            this.goToPage(this.currentPage + 1);
        }
    }

    previousPage(): void {
        if (this.currentPage > 0) {
            this.goToPage(this.currentPage - 1);
        }
    }

    get pages(): number[] {
        return Array.from(
            { length: this.totalPages },
            (_, index) => index
        );
    }

    // =========================================================
    // AFFICHAGE
    // =========================================================

    getMainImage(cure: Cure): string {
        return cure.imageUrl || 'assets/images/default-cure.jpg';
    }

    formatPrice(price: number | null | undefined): string {
        return new Intl.NumberFormat('fr-FR').format(price ?? 0) + ' FCFA';
    }

    getCureTypeLabel(type: string): string {
        return type === 'PREVENTIVE'
            ? 'Préventive'
            : 'Curative';
    }
}
