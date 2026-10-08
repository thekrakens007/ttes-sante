import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
    private router = inject(Router);

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

    partners = [
        {
            id: 1,
            name: 'DAS Group Cameroun',
            category: 'Laboratoire pharmaceutique',
            active: false
        },
        {
            id: 2,
            name: 'PhytoScience Cameroun',
            category: 'Pharmacies',
            active: false
        },
        {
            id: 3,
            name: 'TIENS Cameroun',
            category: 'Pharmacies',
            active: false
        },
        {
            id: 4,
            name: 'VESTIGE Cameroun',
            category: 'Pharmacies',
            active: false
        },
        {
            id: 5,
            name: 'YUPI Global Cameroun',
            category: 'Pharmacies',
            active: false
        },
        {
            id: 6,
            name: 'LONGRICH Cameroun',
            category: 'Pharmacies',
            active: false
        },
        {
            id: 7,
            name: 'Forever Living Cameroun',
            category: 'Soins à base d\'aloe vera',
            active: false
        },
        {
            id: 8,
            name: 'Dynace Global Cameroun',
            category: 'Bien-être',
            active: false
        },
    ];

    reassurance = [
        {
            i: '🚚',
            t: 'Livraison',
            d: 'Douala, Yaoundé et autres villes'
        },
        {
            i: '💬',
            t: 'Conseil par WhatsApp',
            d: 'Une équipe à votre écoute'
        },
        {
            i: '📋',
            t: 'Produits clairement étiquetés',
            d: 'Composition et mode d\'emploi'
        },
        {
            i: '🔒',
            t: 'Paiement sécurisé',
            d: 'Commande simple depuis votre compte'
        },
    ];

    steps = [
        {
            n: 1,
            t: 'Échangez avec nous',
            d: 'Par WhatsApp ou dans l\'une de nos villes de présence.'
        },
        {
            n: 2,
            t: 'Recevez des conseils personnalisés',
            d: 'Produits, doses indiquées sur l\'étiquette, durée d\'utilisation.'
        },
        {
            n: 3,
            t: 'Restez accompagné',
            d: 'Nous restons disponibles pour répondre à vos questions.'
        },
    ];

    packs = [
        {
            t: 'Pack Découverte',
            d: 'Pour essayer la gamme et trouver vos produits préférés.',
            img: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=85'
        },
        {
            t: 'Pack Routine',
            d: 'Une sélection pour l\'utilisation quotidienne sur plusieurs semaines.',
            img: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=900&q=85'
        },
        {
            t: 'Pack Famille',
            d: 'Plusieurs produits à partager, avec un meilleur prix.',
            img: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85'
        },
    ];

    featuredProducts = [
        {
            name: 'Double Stemcell',
            tag: 'Complément alimentaire',
            desc: 'Sachets de complément alimentaire à base d\'extraits végétaux (pomme, raisin), à intégrer à votre routine.',
            image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=85'
        },
        {
            name: 'Crystal Cell',
            tag: 'Complément alimentaire',
            desc: 'Préparation en sachet à base d\'extraits végétaux, pratique à emporter.',
            image: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=900&q=85'
        },
        {
            name: 'NuLite',
            tag: 'Boisson botanique',
            desc: 'Mélange de boisson botanique au psyllium, pour accompagner une alimentation riche en fibres.',
            image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85'
        },
        {
            name: 'SnowPhyll Forte',
            tag: 'Boisson botanique',
            desc: 'Mélange à base d\'herbe de blé, de chlorophylle et d\'algues des neiges.',
            image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=85'
        },
        {
            name: 'iiQ Plus',
            tag: 'Boisson aux fruits',
            desc: 'Mélange de jus de fruits avec lutéine, à savourer au quotidien.',
            image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85'
        },
        {
            name: 'Triple Stemcell',
            tag: 'Soin de la peau',
            desc: 'Gamme de soins : hydratant H2O et essence intense pour le soin quotidien de la peau.',
            image: 'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=900&q=85'
        },
        {
            name: 'NuForte',
            tag: 'Complément alimentaire',
            desc: 'Complément alimentaire en sachets. Voir la fiche pour la composition complète.',
            image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=900&q=85'
        },
        {
            name: 'Actual Plus',
            tag: 'Complément alimentaire',
            desc: 'Complément alimentaire. Voir la fiche pour la composition et le mode d\'emploi.',
            image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=900&q=85'
        },
    ];

    // ===================== INIT =====================

    ngOnInit(): void {
        this.loadProducts();
        this.loadBundles();

        if (this.isLoggedIn()) {
            this.loadCart();
        }
    }

    // ===================== GLOBAL SEARCH =====================

    /**
     * Lance la recherche globale des produits et des packs.
     *
     * La recherche est déclenchée uniquement lorsque
     * l'utilisateur valide le formulaire :
     * - bouton 🔍
     * - touche Entrée
     */
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
                console.error(
                    'Erreur lors du chargement des packs',
                    error
                );

                this.bundles = [];
                this.bundlesError =
                    'Impossible de charger les packs.';
                this.bundlesLoading = false;
            }
        });
    }

    getBundleImage(bundle: BundleResponse): string {
        if (
            !bundle.images ||
            bundle.images.length === 0
        ) {
            return '/images/products/default-product.png';
        }

        const mainImage = bundle.images.find(
            image => image.main
        );

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
        return (
            bundle.stock !== undefined &&
            bundle.stock > 0
        );
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
                console.error(
                    'Erreur chargement panier',
                    error
                );

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

    // ===================== PRODUCTS =====================

    loadProducts(): void {
        this.loading = true;
        this.error = '';

        this.productService
            .getProductsPaginated(
                this.currentPage,
                this.pageSize
            )
            .subscribe({

                next: (response) => {

                    this.products =
                        (response.content ?? [])
                            .filter(
                                product => product.stock > 0
                            );

                    this.totalPages =
                        response.totalPages ?? 0;

                    this.totalElements =
                        response.totalElements ?? 0;

                    this.pages = Array.from(
                        {
                            length: this.totalPages
                        },
                        (_, index) => index
                    );

                    this.buildFilters();

                    this.filteredProducts =
                        [...this.products];

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

                    this.error =
                        'Impossible de charger les produits.';

                    this.loading = false;
                }
            });
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

    // ===================== FILTERS =====================

    buildFilters(): void {

        const categories =
            this.products.flatMap(
                p => p.categories ?? []
            );

        const companies: string[] =
            this.products
                .map(p => p.companyName)
                .filter(
                    (
                        value
                    ): value is string => !!value
                );

        const therapeuticAreas =
            this.products.flatMap(
                p => p.therapeuticAreas ?? []
            );

        this.categories = [
            ...new Set(categories)
        ].sort();

        this.companies = [
            ...new Set(companies)
        ].sort();

        this.therapeuticAreas = [
            ...new Set(therapeuticAreas)
        ].sort();
    }

    /**
     * Filtrage local des produits affichés
     * sur la page d'accueil.
     *
     * Cette méthode est différente de submitSearch().
     * - search() = filtrage local de la liste de l'accueil
     * - submitSearch() = recherche globale produits + packs
     */
    search(): void {

        const term =
            this.searchTerm
                .trim()
                .toLowerCase();

        this.filteredProducts =
            this.products.filter(product => {

                const matchesSearch =
                    !term ||
                    product.name
                        ?.toLowerCase()
                        .includes(term) ||
                    product.brand
                        ?.toLowerCase()
                        .includes(term) ||
                    product.description
                        ?.toLowerCase()
                        .includes(term) ||
                    product.categories
                        ?.some(
                            c =>
                                c
                                    .toLowerCase()
                                    .includes(term)
                        ) ||
                    product.companyName
                        ?.toLowerCase()
                        .includes(term) ||
                    product.therapeuticAreas
                        ?.some(
                            a =>
                                a
                                    .toLowerCase()
                                    .includes(term)
                        );

                const matchesCategory =
                    !this.selectedCategory ||
                    product.categories?.includes(
                        this.selectedCategory
                    );

                const matchesCompany =
                    !this.selectedCompany ||
                    product.companyName ===
                        this.selectedCompany;

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

        this.filteredProducts =
            [...this.products];
    }

    // ===================== PRODUCT IMAGE / PRICE =====================

    getMainImage(product: Product): string {

        if (
            !product.images ||
            product.images.length === 0
        ) {
            return '/images/products/default-product.png';
        }

        const mainImage =
            product.images.find(
                image => image.main
            );

        return (
            mainImage?.imageUrl ||
            product.images[0]?.imageUrl ||
            '/images/products/default-product.png'
        );
    }

    formatPrice(
        price: number | undefined
    ): string {

        return (
            new Intl.NumberFormat('fr-FR')
                .format(price ?? 0) +
            ' FCFA'
        );
    }

    // ===================== AUTH =====================

    isLoggedIn(): boolean {
        return this.authService.isLoggedIn();
    }

    isAdmin(): boolean {
        return this.authService.isAdmin();
    }
}
