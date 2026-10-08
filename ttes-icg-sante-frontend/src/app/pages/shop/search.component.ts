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

    private route = inject(ActivatedRoute);

    private router = inject(Router);

    private searchService = inject(SearchService);

    private productService = inject(ProductService);


    // =========================================================
    // RECHERCHE
    // =========================================================

    /**
     * Mot-clé réellement utilisé par la recherche.
     */
    keyword = '';

    /**
     * Valeur actuellement présente dans le champ de recherche.
     */
    searchInput = '';


    // =========================================================
    // PAGINATION
    // =========================================================

    /**
     * Spring Data utilise une pagination 0-based :
     *
     * page 0 = première page
     * page 1 = deuxième page
     * page 2 = troisième page
     */
    currentPage = 0;

    /**
     * Nombre de produits demandés par page.
     */
    pageSize = 8;


    /**
     * Nombre total de produits.
     */
    totalProducts = 0;


    /**
     * Nombre total de packs.
     */
    totalBundles = 0;


    /**
     * Nombre total de pages produits.
     */
    totalProductPages = 0;


    /**
     * Nombre total de pages packs.
     */
    totalBundlePages = 0;


    // =========================================================
    // FILTRES
    // =========================================================

    selectedCategoryId: number | null = null;

    selectedCompanyId: number | null = null;

    selectedTherapeuticAreaId: number | null = null;


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

    currentYear = new Date().getFullYear();


    // =========================================================
    // INIT
    // =========================================================

    ngOnInit(): void {

        // Charger les listes des filtres.
        this.loadFilters();


        /*
         * IMPORTANT
         *
         * On écoute les paramètres de l'URL.
         *
         * Exemple :
         *
         * /search?q=paracetamol&page=0
         *
         * puis :
         *
         * /search?q=paracetamol&page=1
         *
         * Ici, on NE remet surtout PAS currentPage à 0.
         */
        this.route.queryParams.subscribe(params => {

            // -------------------------------------------------
            // MOT-CLE
            // -------------------------------------------------

            const keyword =
                (params['q'] || '').trim();


            // -------------------------------------------------
            // PAGE
            // -------------------------------------------------

            const pageFromUrl =
                Number(params['page'] ?? 0);


            // -------------------------------------------------
            // ASSIGNATION
            // -------------------------------------------------

            this.keyword = keyword;

            this.searchInput = keyword;


            /*
             * Vérification de la page.
             *
             * Si l'URL contient :
             *
             * page=1
             *
             * currentPage devient 1.
             *
             * On ne remet PAS à 0.
             */
            this.currentPage =
                Number.isFinite(pageFromUrl) &&
                pageFromUrl >= 0
                    ? pageFromUrl
                    : 0;


            // -------------------------------------------------
            // PAS DE MOT-CLE
            // -------------------------------------------------

            if (!keyword) {

                this.products = [];

                this.bundles = [];

                this.totalProducts = 0;

                this.totalBundles = 0;

                this.totalProductPages = 0;

                this.totalBundlePages = 0;

                this.loading = false;

                return;
            }


            // -------------------------------------------------
            // RECHERCHE
            // -------------------------------------------------

            this.executeSearch();
        });
    }


    // =========================================================
    // CHARGEMENT DES FILTRES
    // =========================================================

    loadFilters(): void {

        // -----------------------------------------------------
        // CATEGORIES
        // -----------------------------------------------------

        this.productService
            .getCategories()
            .subscribe({

                next: (categories: any[]) => {

                    this.categories =
                        (categories ?? []).map(
                            category => ({
                                id: Number(category.id),

                                name:
                                    category.name
                            })
                        );
                },

                error: (error) => {

                    console.error(
                        'Erreur chargement catégories :',
                        error
                    );

                    this.categories = [];
                }
            });


        // -----------------------------------------------------
        // ENTREPRISES
        // -----------------------------------------------------

        this.productService
            .getCompanies()
            .subscribe({

                next: (companies: any[]) => {

                    this.companies =
                        (companies ?? []).map(
                            company => ({
                                id: Number(company.id),

                                name:
                                    company.name
                            })
                        );
                },

                error: (error) => {

                    console.error(
                        'Erreur chargement entreprises :',
                        error
                    );

                    this.companies = [];
                }
            });


        // -----------------------------------------------------
        // DOMAINES THERAPEUTIQUES
        // -----------------------------------------------------

        this.productService
            .getTherapeuticAreas()
            .subscribe({

                next: (areas: any[]) => {

                    this.therapeuticAreas =
                        (areas ?? []).map(
                            area => ({
                                id: Number(area.id),

                                name:
                                    area.name ??
                                    area.label
                            })
                        );
                },

                error: (error) => {

                    console.error(
                        'Erreur chargement domaines thérapeutiques :',
                        error
                    );

                    this.therapeuticAreas = [];
                }
            });
    }


    // =========================================================
    // NOUVELLE RECHERCHE
    // =========================================================

    search(): void {

        /*
         * Récupération du texte.
         */
        const keyword =
            this.searchInput.trim();


        /*
         * Mise à jour du mot-clé utilisé.
         */
        this.keyword = keyword;


        /*
         * Une NOUVELLE recherche commence
         * toujours à la première page.
         */
        this.currentPage = 0;


        /*
         * Mettre à jour l'URL.
         *
         * Le subscribe de queryParams
         * appellera ensuite executeSearch().
         */
        this.updateUrl();
    }


    // =========================================================
    // EXECUTION RECHERCHE
    // =========================================================

    private executeSearch(): void {

        // -----------------------------------------------------
        // PAS DE MOT-CLE
        // -----------------------------------------------------

        if (!this.keyword) {

            this.products = [];

            this.bundles = [];

            this.totalProducts = 0;

            this.totalBundles = 0;

            this.totalProductPages = 0;

            this.totalBundlePages = 0;

            return;
        }


        // -----------------------------------------------------
        // LOADING
        // -----------------------------------------------------

        this.loading = true;

        this.error = '';


        // -----------------------------------------------------
        // APPEL API
        // -----------------------------------------------------

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

                // =============================================
                // SUCCESS
                // =============================================

                next: (
                    response: GlobalSearchResponse
                ) => {

                    console.log(
                        'Recherche page :',
                        this.currentPage
                    );

                    console.log(
                        'Réponse recherche :',
                        response
                    );


                    // -----------------------------------------
                    // PRODUITS
                    // -----------------------------------------

                    this.products =
                        response.products ?? [];


                    // -----------------------------------------
                    // PACKS
                    // -----------------------------------------

                    this.bundles =
                        response.bundles ?? [];


                    // -----------------------------------------
                    // TOTAL PRODUITS
                    // -----------------------------------------

                    this.totalProducts =
                        Number(
                            response.totalProducts ?? 0
                        );


                    // -----------------------------------------
                    // TOTAL PACKS
                    // -----------------------------------------

                    this.totalBundles =
                        Number(
                            response.totalBundles ?? 0
                        );


                    // -----------------------------------------
                    // PAGES PRODUITS
                    // -----------------------------------------

                    this.totalProductPages =
                        Number(
                            response.totalProductPages ?? 0
                        );


                    // -----------------------------------------
                    // PAGES PACKS
                    // -----------------------------------------

                    this.totalBundlePages =
                        Number(
                            response.totalBundlePages ?? 0
                        );


                    // -----------------------------------------
                    // FIN LOADING
                    // -----------------------------------------

                    this.loading = false;
                },


                // =============================================
                // ERROR
                // =============================================

                error: (error) => {

                    console.error(
                        'Erreur recherche globale :',
                        error
                    );


                    this.products = [];

                    this.bundles = [];


                    this.totalProducts = 0;

                    this.totalBundles = 0;

                    this.totalProductPages = 0;

                    this.totalBundlePages = 0;


                    this.error =
                        'Impossible de récupérer les résultats de recherche.';


                    this.loading = false;
                }
            });
    }


    // =========================================================
    // FILTRES
    // =========================================================

    applyFilters(): void {

        /*
         * Lorsqu'un filtre change,
         * on revient à la première page.
         */
        this.currentPage = 0;


        /*
         * On conserve le mot-clé
         * et on met à jour la page.
         */
        this.updateUrl();
    }


    // =========================================================
    // RESET FILTRES
    // =========================================================

    resetFilters(): void {

        this.selectedCategoryId = null;

        this.selectedCompanyId = null;

        this.selectedTherapeuticAreaId = null;


        /*
         * Retour première page.
         */
        this.currentPage = 0;


        /*
         * Relancer la recherche.
         */
        this.updateUrl();
    }


    // =========================================================
    // PAGE SUIVANTE
    // =========================================================

    nextPage(): void {

        /*
         * Sécurité :
         *
         * si on est déjà à la dernière page,
         * on ne fait rien.
         */
        if (
            this.currentPage + 1 >=
            this.maxPages
        ) {
            return;
        }


        /*
         * Incrémentation.
         *
         * 0 -> 1
         * 1 -> 2
         * 2 -> 3
         */
        this.currentPage++;


        /*
         * Mise à jour URL.
         *
         * Le subscribe queryParams appellera
         * executeSearch() avec la nouvelle page.
         */
        this.updateUrl();


        /*
         * Remonter en haut.
         */
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }


    // =========================================================
    // PAGE PRECEDENTE
    // =========================================================

    previousPage(): void {

        /*
         * On est déjà à la première page.
         */
        if (this.currentPage <= 0) {
            return;
        }


        /*
         * Exemple :
         *
         * 2 -> 1
         * 1 -> 0
         */
        this.currentPage--;


        /*
         * Mise à jour URL.
         */
        this.updateUrl();


        /*
         * Remonter en haut.
         */
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }


    // =========================================================
    // ALLER A UNE PAGE
    // =========================================================

    goToPage(page: number): void {

        /*
         * Vérification.
         */
        if (
            page < 0 ||
            page >= this.maxPages
        ) {
            return;
        }


        /*
         * Définir la page.
         */
        this.currentPage = page;


        /*
         * Mise à jour URL.
         */
        this.updateUrl();


        /*
         * Remonter en haut.
         */
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }


    // =========================================================
    // NOMBRE MAXIMUM DE PAGES
    // =========================================================

    get maxPages(): number {

        return Math.max(
            this.totalProductPages,
            this.totalBundlePages
        );
    }


    // =========================================================
    // NUMEROS DE PAGES
    // =========================================================

    get pages(): number[] {

        const total =
            this.maxPages;


        if (total <= 0) {
            return [];
        }


        /*
         * On affiche maximum 5 boutons.
         *
         * Exemple :
         *
         * page 0 :
         * 1 2 3 4 5
         *
         * page 5 :
         * 4 5 6 7 8
         */
        const result: number[] = [];


        let start =
            Math.max(
                0,
                this.currentPage - 2
            );


        /*
         * Empêcher start de dépasser
         * la fin de la pagination.
         */
        if (start + 5 > total) {

            start =
                Math.max(
                    0,
                    total - 5
                );
        }


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

        /*
         * IMPORTANT :
         *
         * On utilise uniquement q et page.
         *
         * Les filtres restent dans l'état Angular
         * et ne provoquent pas de boucle.
         */
        this.router.navigate(
            [],
            {
                relativeTo: this.route,

                queryParams: {

                    q:
                        this.keyword ||
                        null,

                    page:
                        this.currentPage
                },

                queryParamsHandling: 'merge'
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


        /*
         * Chercher l'image principale.
         */
        const mainImage =
            product.images.find(
                image => image.main
            );


        if (
            mainImage &&
            mainImage.imageUrl
        ) {

            return mainImage.imageUrl;
        }


        /*
         * Sinon première image.
         */
        const firstImage =
            product.images[0];


        if (
            firstImage &&
            firstImage.imageUrl
        ) {

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


        /*
         * Image principale.
         */
        const mainImage =
            bundle.images.find(
                image => image.main
            );


        if (
            mainImage &&
            mainImage.imageUrl
        ) {

            return mainImage.imageUrl;
        }


        /*
         * Première image.
         */
        const firstImage =
            bundle.images[0];


        if (
            firstImage &&
            firstImage.imageUrl
        ) {

            return firstImage.imageUrl;
        }


        return '/images/products/default-product.png';
    }


    // =========================================================
    // OUVRIR PRODUIT
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
    // OUVRIR PACK
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
