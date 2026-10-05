import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.model';

import { CartService } from '../../../core/services/cart.service';
import { CartResponse } from '../../../core/interfaces/cart.interface';

import { AuthService } from '../../../core/services/auth.service';

import { BundleService } from '../../../core/services/bundle.service';
import { BundleResponse } from '../../../core/interfaces/bundle-response.interface';


interface PaginationPage {
    type: 'page' | 'ellipsis';
    value?: number;
}


@Component({
    selector: 'app-products-list',
    standalone: true,

    imports: [
        CommonModule,
        RouterModule,
        FormsModule
    ],

    templateUrl: './products-list.component.html'
})
export class ProductsListComponent implements OnInit {

    private readonly productService = inject(ProductService);
    private readonly cartService = inject(CartService);
    private readonly authService = inject(AuthService);
    private readonly bundleService = inject(BundleService);


    // =========================================================
    // PRODUITS
    // =========================================================

    products: Product[] = [];
    filteredProducts: Product[] = [];

    loading = true;
    error = '';


    // =========================================================
    // RECHERCHE
    // =========================================================

    searchTerm = '';


    // =========================================================
    // FILTRES
    // =========================================================

    selectedCategory = '';
    selectedCompany = '';
    selectedTherapeuticArea = '';

    categories: string[] = [];
    companies: string[] = [];
    therapeuticAreas: string[] = [];


    // =========================================================
    // PAGINATION
    // =========================================================

    currentPage = 0;

    /**
     * Nombre de produits affichés par page.
     */
    pageSize = 12;

    totalPages = 0;
    totalElements = 0;


    // =========================================================
    // MENU MOBILE
    // =========================================================

    mobileMenuOpen = false;


    // =========================================================
    // PANIER
    // =========================================================

    cart: CartResponse | null = null;
    cartCount = 0;


    // =========================================================
    // INITIALISATION
    // =========================================================

    ngOnInit(): void {
        this.loadProducts();
        this.loadCart();
    }


    // =========================================================
    // CHARGEMENT DES PRODUITS
    // =========================================================

    loadProducts(): void {

        this.loading = true;
        this.error = '';

        const keyword = this.searchTerm.trim();

        const request$ = keyword
            ? this.productService.searchProductsPaginated(
                keyword,
                this.currentPage,
                this.pageSize
            )
            : this.productService.getProductsPaginated(
                this.currentPage,
                this.pageSize
            );

        request$.subscribe({

            next: (response) => {

                this.products = response.content ?? [];

                this.totalPages = response.totalPages ?? 0;

                this.totalElements = response.totalElements ?? 0;

                this.buildFilters();

                this.applyLocalFilters();

                this.loading = false;
            },

            error: (err) => {

                console.error(
                    'Erreur chargement produits :',
                    err
                );

                this.error =
                    'Impossible de charger les produits.';

                this.products = [];
                this.filteredProducts = [];

                this.totalPages = 0;
                this.totalElements = 0;

                this.loading = false;
            }
        });
    }


    // =========================================================
    // RECHERCHE
    // =========================================================

    submitSearch(): void {

        this.currentPage = 0;

        this.loadProducts();
    }


    // =========================================================
    // FILTRES
    // =========================================================

    buildFilters(): void {

        const categories = new Set<string>();
        const companies = new Set<string>();
        const therapeuticAreas = new Set<string>();

        for (const product of this.products) {

            if (product.category) {
                categories.add(product.category);
            }

            if (product.companyName) {
                companies.add(product.companyName);
            }

            if (product.therapeuticArea) {
                therapeuticAreas.add(
                    product.therapeuticArea
                );
            }
        }

        this.categories =
            Array.from(categories).sort();

        this.companies =
            Array.from(companies).sort();

        this.therapeuticAreas =
            Array.from(therapeuticAreas).sort();
    }


    applyLocalFilters(): void {

        this.filteredProducts =
            this.products.filter(product => {

                const matchesCategory =
                    !this.selectedCategory ||
                    product.category === this.selectedCategory;

                const matchesCompany =
                    !this.selectedCompany ||
                    product.companyName === this.selectedCompany;

                const matchesTherapeuticArea =
                    !this.selectedTherapeuticArea ||
                    product.therapeuticArea ===
                    this.selectedTherapeuticArea;

                return (
                    matchesCategory &&
                    matchesCompany &&
                    matchesTherapeuticArea
                );
            });
    }


    onFilterChange(): void {

        this.applyLocalFilters();
    }


    resetFilters(): void {

        this.searchTerm = '';

        this.selectedCategory = '';

        this.selectedCompany = '';

        this.selectedTherapeuticArea = '';

        this.currentPage = 0;

        this.loadProducts();
    }


    // =========================================================
    // PAGINATION
    // =========================================================

    /**
     * Retourne les boutons de pagination.
     *
     * Exemple avec 50 pages :
     *
     * 1 ... 24 25 26 ... 50
     *
     * On utilise des objets plutôt que
     * (number | string)[] afin d'éviter les erreurs
     * de typage dans les templates Angular.
     */
    getPaginationPages(): PaginationPage[] {

        const total = this.totalPages;
        const current = this.currentPage;

        if (total <= 0) {
            return [];
        }


        // -----------------------------------------------------
        // Peu de pages :
        // 1 2 3 4 5 6 7
        // -----------------------------------------------------

        if (total <= 7) {

            return Array.from(
                { length: total },
                (_, index) => ({
                    type: 'page' as const,
                    value: index
                })
            );
        }


        const pages: PaginationPage[] = [];


        // -----------------------------------------------------
        // Première page
        // -----------------------------------------------------

        pages.push({
            type: 'page',
            value: 0
        });


        let start = Math.max(
            1,
            current - 1
        );

        let end = Math.min(
            total - 2,
            current + 1
        );


        // -----------------------------------------------------
        // Début de pagination
        //
        // 1 2 3 4 ... 50
        // -----------------------------------------------------

        if (current <= 2) {

            start = 1;

            end = 3;
        }


        // -----------------------------------------------------
        // Fin de pagination
        //
        // 1 ... 47 48 49 50
        // -----------------------------------------------------

        if (current >= total - 3) {

            start = total - 4;

            end = total - 2;
        }


        // -----------------------------------------------------
        // "..."
        // -----------------------------------------------------

        if (start > 1) {

            pages.push({
                type: 'ellipsis'
            });
        }


        // -----------------------------------------------------
        // Pages centrales
        // -----------------------------------------------------

        for (
            let i = start;
            i <= end;
            i++
        ) {

            pages.push({
                type: 'page',
                value: i
            });
        }


        // -----------------------------------------------------
        // Deuxième "..."
        // -----------------------------------------------------

        if (end < total - 2) {

            pages.push({
                type: 'ellipsis'
            });
        }


        // -----------------------------------------------------
        // Dernière page
        // -----------------------------------------------------

        pages.push({
            type: 'page',
            value: total - 1
        });


        return pages;
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

        this.loadProducts();

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }


    nextPage(): void {

        if (
            this.currentPage <
            this.totalPages - 1
        ) {

            this.currentPage++;

            this.loadProducts();

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }


    previousPage(): void {

        if (this.currentPage > 0) {

            this.currentPage--;

            this.loadProducts();

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }


    // =========================================================
    // PANIER
    // =========================================================

    loadCart(): void {

        if (!this.authService.isAuthenticated()) {
            return;
        }

        this.cartService.getMyCart().subscribe({

            next: (cart) => {

                this.cart = cart;

                this.cartCount =
                    cart?.items?.length ?? 0;
            },

            error: (err) => {

                console.error(
                    'Erreur chargement panier :',
                    err
                );
            }
        });
    }


    // =========================================================
    // MENU MOBILE
    // =========================================================

    toggleMobileMenu(): void {

        this.mobileMenuOpen =
            !this.mobileMenuOpen;
    }


    closeMobileMenu(): void {

        this.mobileMenuOpen = false;
    }
}
