
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { CureService, PageResponse } from '../../../../core/services/cure.service';
import { Cure } from '../../../../core/models/cure.model';
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

    private readonly cureService = inject(CureService);
    private readonly authService = inject(AuthService);
    private readonly cartService = inject(CartService);
    private readonly router = inject(Router);

    currentYear = new Date().getFullYear();
    mobileMenuOpen = false;

    // PANIER
    cart: Cart | null = null;
    cartCount = 0;

    addingCureId: number | null = null;
    cartMessage = '';
    cartError = '';

    // CURES
    cures: Cure[] = [];
    filteredCures: Cure[] = [];
    paginatedCures: Cure[] = [];

    // CHARGEMENT
    loading = true;
    error = '';

    // RECHERCHE ET TRI
    searchTerm = '';
    sortOption: SortOption = '';

    // PAGINATION BACKEND
    currentPage = 0;
    pageSize = 8;
    totalPages = 0;
    totalElements = 0;

    ngOnInit(): void {
        this.loadCures();
        this.loadCart();
    }

    // MENU MOBILE

    toggleMobileMenu(): void {
        this.mobileMenuOpen = !this.mobileMenuOpen;
    }

    closeMobileMenu(): void {
        this.mobileMenuOpen = false;
    }

    // AUTHENTIFICATION

    isLoggedIn(): boolean {
        return this.authService.isLoggedIn();
    }

    isAdmin(): boolean {
        return this.isLoggedIn() &&
            this.authService.hasRole('ROLE_ADMIN');
    }

    // PANIER

    loadCart(): void {
        if (!this.authService.isLoggedIn()) {
            this.cart = null;
            this.cartCount = 0;
            return;
        }

        this.cartService.getCart().subscribe({
            next: (cart: Cart) => this.applyCart(cart),
            error: (error: unknown) => {
                console.error('Erreur chargement panier :', error);
                this.cart = null;
                this.cartCount = 0;
            }
        });
    }

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


    addToCart(cure: Cure): void {
        if (cure.id === undefined || !cure.active) {
            return;
        }

        if (!this.authService.isLoggedIn()) {
            this.router.navigate(['/signin'], {
                queryParams: { returnUrl: this.router.url }
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
                this.addingCureId = null;
                this.cartMessage = `${cure.name} a été ajoutée au panier.`;

                setTimeout(() => {
                    this.cartMessage = '';
                }, 3000);
            },
            error: (error: any) => {
                console.error('Erreur ajout cure au panier :', error);
                this.addingCureId = null;

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

    // CHARGEMENT DES CURES

    loadCures(): void {
        this.loading = true;
        this.error = '';

        this.cureService.getCures(this.currentPage, this.pageSize)
            .subscribe({
                next: (response: PageResponse<Cure>) => {
                    this.cures = response.content ?? [];
                    this.totalPages = response.totalPages;
                    this.totalElements = response.totalElements;
                    this.currentPage = response.number;

                    this.applyFilters();
                    this.loading = false;
                },
                error: (error) => {
                    console.error('Erreur chargement cures :', error);

                    this.cures = [];
                    this.filteredCures = [];
                    this.totalPages = 0;
                    this.totalElements = 0;

                    this.error =
                        error?.error?.message ??
                        'Impossible de charger les cures.';

                    this.loading = false;
                }
            });
    }

    // RECHERCHE ET TRI

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
        this.applyFilters();
    }

    applyFilters(): void {
        const term = this.normalize(this.searchTerm);

        let result = this.cures.filter(cure => {
            const text = this.normalize(
                `${cure.name} ${cure.description ?? ''} ${cure.type}`
            );

            return !term || text.includes(term);
        });

        switch (this.sortOption) {
            case 'price-asc':
                result = [...result].sort(
                    (a, b) => a.price - b.price
                );
                break;

            case 'price-desc':
                result = [...result].sort(
                    (a, b) => b.price - a.price
                );
                break;

            case 'name':
                result = [...result].sort(
                    (a, b) => a.name.localeCompare(b.name, 'fr')
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

    // PAGINATION

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
        this.goToPage(this.currentPage + 1);
    }

    previousPage(): void {
        this.goToPage(this.currentPage - 1);
    }

    get pages(): number[] {
        return Array.from(
            { length: this.totalPages },
            (_, index) => index
        );
    }

    // IMAGES

    getMainImage(cure: Cure): string {
        return cure.imageUrl ||
            '/images/products/default-product.png';
    }

    // PRIX

    formatPrice(price?: number | null): string {
        return new Intl.NumberFormat('fr-FR').format(price ?? 0)
            + ' FCFA';
    }

    // TYPE

    getCureTypeLabel(type: Cure['type']): string {
        return type === 'PREVENTIVE'
            ? 'Préventive'
            : 'Curative';
    }
}
