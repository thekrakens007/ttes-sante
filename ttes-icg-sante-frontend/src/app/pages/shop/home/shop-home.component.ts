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

import { ProductCardComponent } from '../../../shared/components/client/product-card/product-card.component';

import { CartService } from '../../../core/services/cart.service';
import { CartResponse } from '../../../core/interfaces/cart.interface';

import { AuthService } from '../../../core/services/auth.service';

import { BundleService } from '../../../core/services/bundle.service';
import { BundleResponse } from '../../../core/interfaces/bundle-response.interface';


@Component({
    selector: 'app-shop-home',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ProductCardComponent
    ],
    templateUrl: './shop-home.component.html'
})
export class ShopHomeComponent implements OnInit {

    // ===================== PAGINATION =====================

    currentPage = 0;
    pageSize = 8;
    totalPages = 0;
    totalElements = 0;
    pages: number[] = [];

    // ===================== GENERAL =====================

    currentYear = new Date().getFullYear();
    mobileMenuOpen = false;

    // ===================== SERVICES =====================

    private productService = inject(ProductService);
    private cartService = inject(CartService);
    private authService = inject(AuthService);
    private bundleService = inject(BundleService);

    // ===================== CART =====================

    cart: CartResponse | null = null;

    // ===================== PRODUCTS (API) =====================

    products: Product[] = [];
    filteredProducts: Product[] = [];

    // ===================== BUNDLES =====================

    bundles: BundleResponse[] = [];
    bundlesLoading = true;
    bundlesError = '';

    // ===================== SEARCH / FILTERS =====================

    searchTerm = '';

    selectedCategory = '';
    selectedCompany = '';
    selectedTherapeuticArea = '';

    categories: string[] = [];
    companies: string[] = [];
    therapeuticAreas: string[] = [];

    // ===================== LOADING / ERROR =====================

    loading = true;
    error = '';

    // ===================== CONTENU STATIQUE DE LA PAGE D'ACCUEIL =====================

  partners = [...]  et  products = [...]  (voir bas de fichier)

    // ===================== INIT =====================

    ngOnInit(): void {
        this.loadProducts();
        this.loadBundles();

        if (this.isLoggedIn()) {
            this.loadCart();
        }
    }

    // ===================== MOBILE MENU =====================

    toggleMobileMenu(): void {
        this.mobileMenuOpen = !this.mobileMenuOpen;
    }

    closeMobileMenu(): void {
        this.mobileMenuOpen = false;
    }

    // ===================== BUNDLES =====================

    loadBundles(): void {
        this.bundlesLoading = true;
        this.bundlesError = '';

        this.bundleService.getBundles().subscribe({
            next: (bundles) => {
                this.bundles = (bundles ?? []).slice(0, 4);
                this.bundlesLoading = false;
            },
            error: (error) => {
                console.error('Erreur lors du chargement des packs', error);
                this.bundles = [];
                this.bundlesError = 'Impossible de charger les packs.';
                this.bundlesLoading = false;
            }
        });
    }

    getBundleImage(bundle: BundleResponse): string {
        if (!bundle.images || bundle.images.length === 0) {
            return '/images/products/default-product.png';
        }

        const mainImage = bundle.images.find(image => image.main);

        return (
            mainImage?.imageUrl ||
            bundle.images[0]?.imageUrl ||
            '/images/products/default-product.png'
        );
    }

    getBundleItemCount(bundle: BundleResponse): number {
        return bundle.items?.length ?? 0;
    }

    isBundleAvailable(bundle: BundleResponse): boolean {
        return bundle.stock !== undefined && bundle.stock > 0;
    }

    // ===================== CART =====================

    loadCart(): void {
        if (!this.isLoggedIn()) {
            this.cart = null;
            return;
        }

        this.cartService.getCart().subscribe({
            next: (cart) => {
                this.cart = cart;
            },
            error: (error) => {
                console.error('Erreur chargement panier', error);
                this.cart = null;
            }
        });
    }

    isProductInCart(productId: number): boolean {
        if (!this.cart?.items) {
            return false;
        }

        return this.cart.items.some(item => item.productId === productId);
    }

    getProductQuantity(productId: number): number {
        if (!this.cart?.items) {
            return 0;
        }

        const item = this.cart.items.find(i => i.productId === productId);

        return item?.quantity ?? 0;
    }

    // ===================== PRODUCTS =====================

    loadProducts(): void {
        this.loading = true;
        this.error = '';

        this.productService
            .getProductsPaginated(this.currentPage, this.pageSize)
            .subscribe({
                next: (response) => {
                    this.products = (response.content ?? []).filter(
                        product => product.stock > 0
                    );

                    this.totalPages = response.totalPages ?? 0;
                    this.totalElements = response.totalElements ?? 0;

                    this.pages = Array.from(
                        { length: this.totalPages },
                        (_, index) => index
                    );

                    this.buildFilters();

                    this.filteredProducts = [...this.products];
                    this.search();

                    this.loading = false;
                },
                error: (error) => {
                    console.error('Erreur lors du chargement des produits', error);

                    this.products = [];
                    this.filteredProducts = [];
                    this.totalPages = 0;
                    this.totalElements = 0;
                    this.pages = [];

                    this.error = 'Impossible de charger les produits.';
                    this.loading = false;
                }
            });
    }

    // ===================== PAGINATION =====================

    goToPage(page: number): void {
        if (page < 0 || page >= this.totalPages || page === this.currentPage) {
            return;
        }

        this.currentPage = page;
        this.loadProducts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages - 1) {
            this.currentPage++;
            this.loadProducts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    previousPage(): void {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.loadProducts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // ===================== FILTERS =====================

    buildFilters(): void {
        const categories = this.products.flatMap(p => p.categories ?? []);

        const companies: string[] = this.products
            .map(p => p.companyName)
            .filter((value): value is string => !!value);

        const therapeuticAreas = this.products.flatMap(
            p => p.therapeuticAreas ?? []
        );

        this.categories = [...new Set(categories)].sort();
        this.companies = [...new Set(companies)].sort();
        this.therapeuticAreas = [...new Set(therapeuticAreas)].sort();
    }

    search(): void {
        const term = this.searchTerm.trim().toLowerCase();

        this.filteredProducts = this.products.filter(product => {

            const matchesSearch =
                !term ||
                product.name?.toLowerCase().includes(term) ||
                product.brand?.toLowerCase().includes(term) ||
                product.description?.toLowerCase().includes(term) ||
                product.categories?.some(c => c.toLowerCase().includes(term)) ||
                product.companyName?.toLowerCase().includes(term) ||
                product.therapeuticAreas?.some(a => a.toLowerCase().includes(term));

            const matchesCategory =
                !this.selectedCategory ||
                product.categories?.includes(this.selectedCategory);

            const matchesCompany =
                !this.selectedCompany ||
                product.companyName === this.selectedCompany;

            const matchesTherapeuticArea =
                !this.selectedTherapeuticArea ||
                product.therapeuticAreas?.includes(this.selectedTherapeuticArea);

            return (
                matchesSearch &&
                matchesCategory &&
                matchesCompany &&
                matchesTherapeuticArea
            );
        });
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.selectedCategory = '';
        this.selectedCompany = '';
        this.selectedTherapeuticArea = '';
        this.filteredProducts = [...this.products];
    }

    // ===================== PRODUCT IMAGE / PRICE =====================

    getMainImage(product: Product): string {
        if (!product.images || product.images.length === 0) {
            return '/images/products/default-product.png';
        }

        const mainImage = product.images.find(image => image.main);

        return (
            mainImage?.imageUrl ||
            product.images[0]?.imageUrl ||
            '/images/products/default-product.png'
        );
    }

    formatPrice(price: number | undefined): string {
        return new Intl.NumberFormat('fr-FR').format(price ?? 0) + ' FCFA';
    }

    // ===================== AUTH =====================

    isLoggedIn(): boolean {
        return this.authService.isLoggedIn();
    }

    isAdmin(): boolean {
        return this.authService.isAdmin();
    }
}
