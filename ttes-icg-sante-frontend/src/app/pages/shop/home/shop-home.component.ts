import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.model';

import { ProductCardComponent } from '../../../shared/components/client/product-card/product-card.component';

import { CartService } from '../../../core/services/cart.service';
import { CartResponse } from '../../../core/interfaces/cart.interface';

import { AuthService } from '../../../core/services/auth.service';

import { BundleService } from '../../../core/services/bundle.service';
import { BundleResponse } from '../../../core/interfaces/bundle-response.interface';

import { CompanyCategoryService } from '../../../core/services/company-category.service';
import { CompanyCategoryResponse } from '../../../core/interfaces/company-category-response.interface';

@Component({
    selector: 'app-shop-home',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule
    ],
    templateUrl: './shop-home.component.html'
})
export class ShopHomeComponent implements OnInit {

    // ===================== PAGINATION PRINCIPALE =====================

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
    private router = inject(Router);
    private companyCategoryService = inject(CompanyCategoryService);

    // ===================== CART =====================

    cart: CartResponse | null = null;

    // ===================== PRODUCTS =====================

    products: Product[] = [];
    filteredProducts: Product[] = [];

    // Produits dédiés à la section des trois entreprises
    featuredCompanyProducts: Product[] = [];
    featuredCompanyProductsLoading = false;
    featuredCompanyProductsError = '';

    private readonly featuredCompanyNames = [
        'tiens cameroun',
        'das group cameroun',
        'phytoscience cameroun'
    ];

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




    // ===================== COMPANY CATEGORIES =====================

    companyCategories: CompanyCategoryResponse[] = [];
    companyCategoriesLoading = false;
    companyCategoriesError = '';

    // ===================== INITIALISATION =====================

    ngOnInit(): void {
        this.loadProducts();
        this.loadFeaturedCompanyProducts();
        this.loadBundles();
        this.loadCompanyCategories();

        if (this.isLoggedIn()) {
            this.loadCart();
        }
    }

    // ===================== IMAGE ERROR =====================

    onProductImageError(event: Event): void {
        const img = event.target as HTMLImageElement;
        const fallback = '/images/products/default-product.png';

        if (!img.src.endsWith(fallback)) {
            img.src = fallback;
        }
    }

    // ===================== RECHERCHE GLOBALE =====================

    submitSearch(): void {
        const keyword = this.searchTerm?.trim();

        if (!keyword) {
            return;
        }

        this.router.navigate(['/search'], {
            queryParams: {
                q: keyword
            }
        });
    }

    // ===================== MENU MOBILE =====================

    toggleMobileMenu(): void {
        this.mobileMenuOpen = !this.mobileMenuOpen;
    }

    closeMobileMenu(): void {
        this.mobileMenuOpen = false;
    }

    // ===================== CHARGEMENT DES PACKS =====================

    loadBundles(): void {
        this.bundlesLoading = true;
        this.bundlesError = '';

        this.bundleService.getBundles().subscribe({
            next: (bundles) => {
                this.bundles = (bundles ?? []).slice(0, 4);
                this.bundlesLoading = false;
            },
            error: (error) => {
                console.error(
                    'Erreur lors du chargement des packs',
                    error
                );

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

    // ===================== PANIER =====================

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

        return this.cart.items.some(
            item => item.productId === productId
        );
    }

    getProductQuantity(productId: number): number {
        if (!this.cart?.items) {
            return 0;
        }

        const item = this.cart.items.find(
            i => i.productId === productId
        );

        return item?.quantity ?? 0;
    }

    // ===================== PRODUITS : PAGINATION PRINCIPALE =====================

    loadProducts(): void {
        this.loading = true;
        this.error = '';

        this.productService
            .getProductsPaginated(this.currentPage, this.pageSize)
            .subscribe({
                next: (response) => {
                    this.products = (response.content ?? [])
                        .filter(product => product.stock > 0);

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
                    console.error(
                        'Erreur lors du chargement des produits',
                        error
                    );

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

    // ===================== PRODUITS DES TROIS ENTREPRISES =====================

    /**
     * Charge les produits de toutes les pages de l'API indépendamment
     * de la pagination principale de la page d'accueil.
     *
     * IMPORTANT : cette méthode suppose que l'API accepte une taille
     * de page de 100. Si le backend impose une limite plus faible,
     * utiliser cette limite ou adapter le backend.
     */


    loadFeaturedCompanyProducts(): void {
        this.featuredCompanyProductsLoading = true;
        this.featuredCompanyProductsError = '';

        const normalize = (value: string | null | undefined): string =>
            (value ?? '')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, ' ')
                .trim();

        this.productService.getCompanies().subscribe({
            next: (companies) => {
                const targets = [
                    'tiens cameroun',
                    'das group cameroun',
                    'phytoscience cameroun'
                ];

                // Retrouver les vrais identifiants depuis l'API.
                const selectedCompanies = targets
                    .map(target =>
                        companies.find(company =>
                            normalize(company.name).includes(target) ||
                            target.includes(normalize(company.name))
                        )
                    )
                    .filter((company): company is NonNullable<typeof company> =>
                        company !== undefined
                    );

                if (selectedCompanies.length === 0) {
                    this.featuredCompanyProducts = [];
                    this.featuredCompanyProductsError =
                        'Aucune des trois entreprises n’a été trouvée.';
                    this.featuredCompanyProductsLoading = false;
                    return;
                }

                // Charger uniquement les premiers produits de chaque entreprise.
                // Huit produits sont examinés pour pouvoir ignorer ceux sans stock.
                const requests = selectedCompanies.map(company =>
                    this.productService.getProductsPaginated(
                        0,
                        1,
                        undefined,
                        undefined,
                        company.id
                    )
                );

                forkJoin(requests).subscribe({
                    next: responses => {
                        this.featuredCompanyProducts = responses
                            .map(response => response.content?.[0])
                            .filter((product): product is Product =>
                                product !== undefined && product.stock > 0
                            );

                        if (this.featuredCompanyProducts.length === 0) {
                            this.featuredCompanyProductsError =
                                'Aucun produit disponible pour ces entreprises.';
                        }

                        this.featuredCompanyProductsLoading = false;
                    },
                    error: error => {
                        console.error(
                            'Erreur de chargement des produits mis en avant',
                            error
                        );

                        this.featuredCompanyProducts = [];
                        this.featuredCompanyProductsError =
                            'Impossible de charger les produits mis en avant.';
                        this.featuredCompanyProductsLoading = false;
                    }
                });
            },
            error: error => {
                console.error(
                    'Erreur lors du chargement des entreprises',
                    error
                );

                this.featuredCompanyProducts = [];
                this.featuredCompanyProductsError =
                    'Impossible de charger les entreprises.';
                this.featuredCompanyProductsLoading = false;
            }
        });
    }


private finishFeaturedCompanyProducts(products: Product[]): void {
    const normalize = (value: string | null | undefined): string =>
        (value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();

    const allowedCompanies = [
        'das group cameroun',
        'tiens cameroun',
        'dynace global cameroun'
    ];

    const matchesCompany = (companyName: string | null | undefined): boolean => {
        const company = normalize(companyName);

        return allowedCompanies.some(name =>
            company.includes(name) || name.includes(company)
        ) && company.length > 0;
    };

    const uniqueProducts = new Map<number, Product>();

    for (const product of products) {
        if (
            product.stock > 0 &&
            matchesCompany(product.companyName)
        ) {
            uniqueProducts.set(product.id, product);
        }
    }

    this.featuredCompanyProducts = Array
        .from(uniqueProducts.values())
        .slice(0, 8);

    this.featuredCompanyProductsLoading = false;

    console.log(
        'Produits des trois entreprises :',
        this.featuredCompanyProducts
    );

    console.log(
        'Noms des entreprises retournés par l’API :',
        [...new Set(products.map(p => p.companyName))]
    );
}
    /**
     * Filtre les produits disponibles des trois entreprises,
     * en normalisant la casse et les espaces du nom d'entreprise.
     */
    private filterFeaturedCompanyProducts(products: Product[]): Product[] {
        const seen = new Set<number>();

        return products
            .filter(product => {
                const company = (product.companyName ?? '')
                    .trim()
                    .toLowerCase();

                return (
                    product.stock > 0 &&
                    this.featuredCompanyNames.includes(company)
                );
            })
            .filter(product => {
                if (seen.has(product.id)) {
                    return false;
                }

                seen.add(product.id);
                return true;
            })
            .slice(0, 8);
    }

    // ===================== PAGINATION =====================

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
        if (this.currentPage < this.totalPages - 1) {
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

    // ===================== FILTRES =====================

    buildFilters(): void {
        const categories = this.products.flatMap(
            p => p.categories ?? []
        );

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

    // ===================== CATÉGORIES D'ENTREPRISES =====================

    loadCompanyCategories(): void {
        this.companyCategoriesLoading = true;
        this.companyCategoriesError = '';

        this.companyCategoryService.getCategories().subscribe({
            next: (categories) => {
                this.companyCategories = categories ?? [];
                this.companyCategoriesLoading = false;
            },
            error: (error) => {
                console.error(
                    'Erreur lors du chargement des catégories d’entreprises',
                    error
                );

                this.companyCategories = [];
                this.companyCategoriesError =
                    'Impossible de charger les catégories pour le moment.';
                this.companyCategoriesLoading = false;
            }
        });
    }

    // ===================== RECHERCHE ET FILTRAGE LOCAL =====================

    search(): void {
        const term = this.searchTerm.trim().toLowerCase();

        this.filteredProducts = this.products.filter(product => {
            const matchesSearch =
                !term ||
                product.name?.toLowerCase().includes(term) ||
                product.brand?.toLowerCase().includes(term) ||
                product.description?.toLowerCase().includes(term) ||
                product.categories?.some(
                    category => category.toLowerCase().includes(term)
                ) ||
                product.companyName?.toLowerCase().includes(term) ||
                product.therapeuticAreas?.some(
                    area => area.toLowerCase().includes(term)
                );

            const matchesCategory =
                !this.selectedCategory ||
                product.categories?.includes(this.selectedCategory);

            const matchesCompany =
                !this.selectedCompany ||
                product.companyName === this.selectedCompany;

            const matchesTherapeuticArea =
                !this.selectedTherapeuticArea ||
                product.therapeuticAreas?.includes(
                    this.selectedTherapeuticArea
                );

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

    // ===================== IMAGES ET PRIX =====================

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
        return (
            new Intl.NumberFormat('fr-FR').format(price ?? 0) +
            ' FCFA'
        );
    }

    // ===================== AUTHENTIFICATION =====================

    isLoggedIn(): boolean {
        return this.authService.isLoggedIn();
    }

    isAdmin(): boolean {
        return this.authService.isAdmin();
    }
}
