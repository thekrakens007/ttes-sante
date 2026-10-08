import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';

import {
    FormsModule
} from '@angular/forms';

import {
    ActivatedRoute,
    Router,
    RouterModule
} from '@angular/router';

import {
    SearchService
} from '../../core/services/search.service';

import {
    ProductService
} from '../../core/services/product.service';

import {
    Product
} from '../../core/models/product.model';

import {
    GlobalSearchResponse,
    Bundle
} from '../../core/models/global-search.model';


interface FilterOption {

    id: number;

    name: string;
}


@Component({
    selector: 'app-search',

    standalone: true,

    imports: [
        CommonModule,
        FormsModule,
        RouterModule
    ],

    templateUrl: './search.component.html'
})
export class SearchComponent implements OnInit {

    // =========================================================
    // SERVICES
    // =========================================================

    private route =
        inject(ActivatedRoute);

    private router =
        inject(Router);

    private searchService =
        inject(SearchService);

    private productService =
        inject(ProductService);


    // =========================================================
    // RECHERCHE
    // =========================================================

    keyword = '';

    searchInput = '';


    // =========================================================
    // PAGINATION
    // =========================================================

    currentPage = 0;

    pageSize = 8;

    totalProducts = 0;

    totalBundles = 0;

    totalProductPages = 0;

    totalBundlePages = 0;


    // =========================================================
    // FILTRES
    // =========================================================

    selectedCategoryId:
        number | null = null;

    selectedCompanyId:
        number | null = null;

    selectedTherapeuticAreaId:
        number | null = null;


    categories: FilterOption[] = [];

    companies: FilterOption[] = [];

    therapeuticAreas: FilterOption[] = [];


    // =========================================================
    // RESULTATS
    // =========================================================

    products: Product[] = [];

    bundles: Bundle[] = [];


    // =========================================================
    // ETAT
    // =========================================================

    loading = false;

    error = '';

    currentYear =
        new Date().getFullYear();


    // =========================================================
    // INIT
    // =========================================================

    ngOnInit(): void {

        this.loadFilters();


        this.route.queryParams.subscribe(
            params => {

                const keyword =
                    (
                        params['q'] ||
                        ''
                    ).trim();


                this.keyword =
                    keyword;


                this.searchInput =
                    keyword;


                this.currentPage =
                    Number(
                        params['page'] || 0
                    );


                if (!keyword) {

                    this.products = [];

                    this.bundles = [];

                    return;
                }


                this.search();
            }
        );
    }


    // =========================================================
    // CHARGEMENT FILTRES
    // =========================================================

    loadFilters(): void {

        /*
         * Adapte ces méthodes aux méthodes
         * déjà présentes dans ton ProductService.
         */

        this.productService
            .getCategories()
            .subscribe({

                next: categories => {

                    this.categories =
                        (categories ?? [])
                            .map(
                                (category: any) => ({
                                    id: category.id,
                                    name: category.name
                                })
                            );
                },

                error: error => {

                    console.error(
                        'Erreur catégories',
                        error
                    );
                }
            });


        this.productService
            .getCompanies()
            .subscribe({

                next: companies => {

                    this.companies =
                        (companies ?? [])
                            .map(
                                (company: any) => ({
                                    id: company.id,
                                    name: company.name
                                })
                            );
                },

                error: error => {

                    console.error(
                        'Erreur entreprises',
                        error
                    );
                }
            });


        this.productService
            .getTherapeuticAreas()
            .subscribe({

                next: areas => {

                    this.therapeuticAreas =
                        (areas ?? [])
                            .map(
                                (area: any) => ({
                                    id: area.id,
                                    name:
                                        area.name ??
                                        area.label
                                })
                            );
                },

                error: error => {

                    console.error(
                        'Erreur domaines thérapeutiques',
                        error
                    );
                }
            });
    }


    // =========================================================
    // RECHERCHE
    // =========================================================

    search(): void {

        const keyword =
            this.searchInput.trim();


        this.keyword =
            keyword;


        this.currentPage =
            0;


        this.updateUrl();


        this.executeSearch();
    }


    // =========================================================
    // EXECUTER RECHERCHE
    // =========================================================

    private executeSearch(): void {

        if (!this.keyword) {

            this.products = [];

            this.bundles = [];

            return;
        }


        this.loading = true;

        this.error = '';


        this.searchService
            .search(

                this.keyword,

                this.currentPage,

                this.pageSize,

                this.selectedCategoryId,

                this.selectedCompanyId,

                this.selectedTherapeuticAreaId

            )
            .subscribe({

                next:
                    (
                        response:
                        GlobalSearchResponse
                    ) => {

                        this.products =
                            response.products ?? [];


                        this.bundles =
                            response.bundles ?? [];


                        this.totalProducts =
                            response.totalProducts ?? 0;


                        this.totalBundles =
                            response.totalBundles ?? 0;


                        this.totalProductPages =
                            response.totalProductPages ?? 0;


                        this.totalBundlePages =
                            response.totalBundlePages ?? 0;


                        this.loading =
                            false;
                    },


                error:
                    error => {

                        console.error(
                            'Erreur recherche globale',
                            error
                        );


                        this.products = [];

                        this.bundles = [];


                        this.error =
                            'Impossible de récupérer les résultats de recherche.';


                        this.loading =
                            false;
                    }
            });
    }


    // =========================================================
    // FILTRE
    // =========================================================

    applyFilters(): void {

        this.currentPage = 0;

        this.updateUrl();

        this.executeSearch();
    }


    // =========================================================
    // RESET FILTRES
    // =========================================================

    resetFilters(): void {

        this.selectedCategoryId = null;

        this.selectedCompanyId = null;

        this.selectedTherapeuticAreaId = null;

        this.currentPage = 0;

        this.updateUrl();

        this.executeSearch();
    }


    // =========================================================
    // PAGE SUIVANTE
    // =========================================================

    nextPage(): void {

        if (
            this.currentPage + 1 >=
            this.maxPages
        ) {
            return;
        }


        this.currentPage++;

        this.updateUrl();

        this.executeSearch();

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }


    // =========================================================
    // PAGE PRECEDENTE
    // =========================================================

    previousPage(): void {

        if (this.currentPage <= 0) {
            return;
        }


        this.currentPage--;

        this.updateUrl();

        this.executeSearch();

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }


    // =========================================================
    // ALLER A UNE PAGE
    // =========================================================

    goToPage(
        page: number
    ): void {

        if (
            page < 0 ||
            page >= this.maxPages
        ) {
            return;
        }


        this.currentPage =
            page;


        this.updateUrl();

        this.executeSearch();

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }


    // =========================================================
    // PAGES
    // =========================================================

    get maxPages(): number {

        return Math.max(
            this.totalProductPages,
            this.totalBundlePages
        );
    }


    get pages(): number[] {

        const total =
            this.maxPages;


        if (total <= 0) {
            return [];
        }


        const result: number[] = [];


        const start =
            Math.max(
                0,
                this.currentPage - 2
            );


        const end =
            Math.min(
                total,
                start + 5
            );


        for (
            let i = start;
            i < end;
            i++
        ) {

            result.push(i);
        }


        return result;
    }


    // =========================================================
    // URL
    // =========================================================

    private updateUrl(): void {

        this.router.navigate(
            [],
            {
                relativeTo:
                    this.route,

                queryParams: {
                    q: this.keyword,

                    page:
                        this.currentPage
                },

                queryParamsHandling:
                    'merge'
            }
        );
    }


    // =========================================================
    // RESULTATS
    // =========================================================

    get hasResults(): boolean {

        return (
            this.products.length > 0 ||
            this.bundles.length > 0
        );
    }


    // =========================================================
    // IMAGE PRODUIT
    // =========================================================

    getProductImage(
        product: Product
    ): string {

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


        if (mainImage?.imageUrl) {

            return mainImage.imageUrl;
        }


        const firstImage =
            product.images[0];


        if (firstImage?.imageUrl) {

            return firstImage.imageUrl;
        }


        return '/images/products/default-product.png';
    }


    // =========================================================
    // IMAGE PACK
    // =========================================================

    getBundleImage(
        bundle: Bundle
    ): string {

        if (
            !bundle.images ||
            bundle.images.length === 0
        ) {

            return '/images/products/default-product.png';
        }


        const mainImage =
            bundle.images.find(
                image => image.main
            );


        if (mainImage?.imageUrl) {

            return mainImage.imageUrl;
        }


        const firstImage =
            bundle.images[0];


        if (firstImage?.imageUrl) {

            return firstImage.imageUrl;
        }


        return '/images/products/default-product.png';
    }


    // =========================================================
    // PRODUIT
    // =========================================================

    openProduct(
        product: Product
    ): void {

        if (!product?.id) {
            return;
        }


        this.router.navigate([
            '/products',
            product.id
        ]);
    }


    // =========================================================
    // PACK
    // =========================================================

    openBundle(
        bundle: Bundle
    ): void {

        if (!bundle?.id) {
            return;
        }


        this.router.navigate([
            '/bundles',
            bundle.id
        ]);
    }
}
