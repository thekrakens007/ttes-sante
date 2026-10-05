import {
    Component,
    OnInit,
    inject
} from '@angular/core';

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

    private bundleService = inject(BundleService);


    // ============================================================
    // DONNÉES
    // ============================================================

    bundles: BundleResponse[] = [];

    filteredBundles: BundleResponse[] = [];

    paginatedBundles: BundleResponse[] = [];


    // ============================================================
    // ÉTAT
    // ============================================================

    loading = true;

    error = '';

    deletingBundleId: number | null = null;


    // ============================================================
    // RECHERCHE
    // ============================================================

    searchTerm = '';


    // ============================================================
    // FILTRES
    // ============================================================

    statusFilter:
        'all' |
        'active' |
        'inactive' = 'all';

    stockFilter:
        'all' |
        'available' |
        'low' |
        'out' = 'all';


    // ============================================================
    // PAGINATION
    // ============================================================

    currentPage = 1;

    pageSize = 9;

    pageSizeOptions = [
        6,
        9,
        12,
        24
    ];


    // ============================================================
    // INITIALISATION
    // ============================================================

    ngOnInit(): void {

        this.loadBundles();

    }


    // ============================================================
    // CHARGEMENT
    // ============================================================

    loadBundles(): void {

        this.loading = true;

        this.error = '';

        this.bundleService
            .getAdminBundles()
            .subscribe({

                next: (bundles) => {

                    this.bundles =
                        bundles ?? [];

                    this.applyFilters();

                    this.loading = false;

                },

                error: (error) => {

                    console.error(
                        'Erreur chargement packs :',
                        error
                    );

                    this.error =
                        error?.error?.message ??
                        'Impossible de charger les packs.';

                    this.loading = false;

                }

            });

    }


    // ============================================================
    // RECHERCHE
    // ============================================================

    onSearch(): void {

        this.currentPage = 1;

        this.applyFilters();

    }


    clearSearch(): void {

        this.searchTerm = '';

        this.currentPage = 1;

        this.applyFilters();

    }


    /**
     * Recherche dans toutes les caractéristiques
     * du pack et de ses produits.
     */
    private matchesSearch(
        bundle: BundleResponse,
        search: string
    ): boolean {

        if (!search) {

            return true;

        }


        /*
         * --------------------------------------------------------
         * CARACTÉRISTIQUES DU PACK
         * --------------------------------------------------------
         */

        const bundleFields: string[] = [

            // Nom
            bundle.name,

            // Description
            bundle.description,

            // ID
            String(bundle.id),

            // Prix
            String(bundle.price),

            // Stock
            String(bundle.stock)

        ];


        /*
         * --------------------------------------------------------
         * CARACTÉRISTIQUES DES PRODUITS
         * --------------------------------------------------------
         */

        const productFields: string[] = [];


        if (
            bundle.items &&
            bundle.items.length > 0
        ) {

            bundle.items.forEach(
                (item: any) => {

                    /*
                     * Le backend peut renvoyer
                     * directement les informations du produit
                     * ou un objet product imbriqué.
                     */

                    const product =
                        item.product ??
                        item;


                    if (!product) {

                        return;

                    }


                    // =================================================
                    // IDENTIFIANTS
                    // =================================================

                    productFields.push(
                        String(
                            product.id ??
                            ''
                        )
                    );

                    productFields.push(
                        String(
                            item.productId ??
                            ''
                        )
                    );


                    // =================================================
                    // INFORMATIONS GÉNÉRALES
                    // =================================================

                    productFields.push(
                        product.name ??
                        item.productName ??
                        ''
                    );

                    productFields.push(
                        product.sku ??
                        ''
                    );

                    productFields.push(
                        product.description ??
                        ''
                    );


                    // =================================================
                    // CARACTÉRISTIQUES PHARMACEUTIQUES
                    // =================================================

                    productFields.push(
                        product.brand ??
                        ''
                    );

                    productFields.push(
                        product.activeIngredient ??
                        ''
                    );

                    productFields.push(
                        product.dosage ??
                        ''
                    );

                    productFields.push(
                        product.form ??
                        ''
                    );

                    productFields.push(
                        product.ingredients ??
                        ''
                    );


                    // =================================================
                    // ENTREPRISE
                    // =================================================

                    productFields.push(
                        product.companyName ??
                        ''
                    );


                    productFields.push(
                        String(
                            product.companyId ??
                            ''
                        )
                    );


                    // =================================================
                    // CATÉGORIES
                    // =================================================

                    if (
                        Array.isArray(
                            product.categories
                        )
                    ) {

                        productFields.push(
                            ...product.categories
                        );

                    }


                    /*
                     * Dans certains retours API,
                     * les catégories peuvent être des objets.
                     */

                    if (
                        Array.isArray(
                            product.categoryNames
                        )
                    ) {

                        productFields.push(
                            ...product.categoryNames
                        );

                    }


                    // =================================================
                    // DOMAINES THÉRAPEUTIQUES
                    // =================================================

                    if (
                        Array.isArray(
                            product.therapeuticAreas
                        )
                    ) {

                        productFields.push(
                            ...product.therapeuticAreas
                        );

                    }


                    if (
                        Array.isArray(
                            product.therapeuticAreaNames
                        )
                    ) {

                        productFields.push(
                            ...product.therapeuticAreaNames
                        );

                    }


                    // =================================================
                    // PRIX / STOCK
                    // =================================================

                    productFields.push(
                        String(
                            product.price ??
                            ''
                        )
                    );

                    productFields.push(
                        String(
                            product.stock ??
                            item.stock ??
                            ''
                        )
                    );


                    // =================================================
                    // QUANTITÉ DANS LE PACK
                    // =================================================

                    productFields.push(
                        String(
                            item.quantity ??
                            ''
                        )
                    );

                }
            );

        }


        /*
         * --------------------------------------------------------
         * CONSTRUCTION DU TEXTE DE RECHERCHE
         * --------------------------------------------------------
         */

        const searchableText = [
            ...bundleFields,
            ...productFields
        ]
            .filter(
                value =>
                    value !== null &&
                    value !== undefined &&
                    String(value).trim() !== ''
            )
            .map(
                value =>
                    this.normalizeSearchText(
                        String(value)
                    )
            )
            .join(' ');


        /*
         * --------------------------------------------------------
         * RECHERCHE
         * --------------------------------------------------------
         */

        const normalizedSearch =
            this.normalizeSearchText(
                search
            );


        return searchableText.includes(
            normalizedSearch
        );

    }


    /**
     * Normalise le texte afin que :
     *
     * "Paracétamol"
     *
     * puisse être trouvé avec :
     *
     * "paracetamol"
     *
     * et inversement.
     */
    private normalizeSearchText(
        value: string
    ): string {

        return value
            .normalize('NFD')
            .replace(
                /[\u0300-\u036f]/g,
                ''
            )
            .toLowerCase()
            .trim();

    }


    // ============================================================
    // FILTRES
    // ============================================================

    onStatusFilterChange(): void {

        this.currentPage = 1;

        this.applyFilters();

    }


    onStockFilterChange(): void {

        this.currentPage = 1;

        this.applyFilters();

    }


    applyFilters(): void {

        const search =
            this.searchTerm.trim();


        this.filteredBundles =
            this.bundles.filter(
                bundle => {

                    // =================================================
                    // RECHERCHE GLOBALE
                    // =================================================

                    if (
                        search &&
                        !this.matchesSearch(
                            bundle,
                            search
                        )
                    ) {

                        return false;

                    }


                    // =================================================
                    // STATUT
                    // =================================================

                    if (
                        this.statusFilter ===
                        'active' &&
                        !bundle.active
                    ) {

                        return false;

                    }


                    if (
                        this.statusFilter ===
                        'inactive' &&
                        bundle.active
                    ) {

                        return false;

                    }


                    // =================================================
                    // STOCK
                    // =================================================

                    const stock =
                        Number(
                            bundle.stock ?? 0
                        );


                    if (
                        this.stockFilter ===
                        'available' &&
                        stock <= 5
                    ) {

                        return false;

                    }


                    if (
                        this.stockFilter ===
                        'low' &&
                        (
                            stock <= 0 ||
                            stock > 5
                        )
                    ) {

                        return false;

                    }


                    if (
                        this.stockFilter ===
                        'out' &&
                        stock > 0
                    ) {

                        return false;

                    }


                    return true;

                }
            );


        /*
         * Corriger la page actuelle si nécessaire.
         */

        const totalPages =
            this.totalPages;


        if (
            totalPages > 0 &&
            this.currentPage > totalPages
        ) {

            this.currentPage =
                totalPages;

        }


        if (
            totalPages === 0
        ) {

            this.currentPage = 1;

        }


        this.updatePagination();

    }


    // ============================================================
    // PAGINATION
    // ============================================================

    get totalItems(): number {

        return this.filteredBundles.length;

    }


    get totalPages(): number {

        if (
            this.filteredBundles.length === 0
        ) {

            return 0;

        }


        return Math.ceil(
            this.filteredBundles.length /
            this.pageSize
        );

    }


    get pages(): number[] {

        return Array.from(
            {
                length:
                    this.totalPages
            },
            (_, index) =>
                index + 1
        );

    }


    updatePagination(): void {

        const start =
            (this.currentPage - 1) *
            this.pageSize;

        const end =
            start +
            this.pageSize;


        this.paginatedBundles =
            this.filteredBundles.slice(
                start,
                end
            );

    }


    goToPage(
        page: number
    ): void {

        if (
            page < 1 ||
            page > this.totalPages
        ) {

            return;

        }


        this.currentPage =
            page;

        this.updatePagination();

        this.scrollToTop();

    }


    previousPage(): void {

        if (
            this.currentPage <= 1
        ) {

            return;

        }


        this.currentPage--;

        this.updatePagination();

        this.scrollToTop();

    }


    nextPage(): void {

        if (
            this.currentPage >=
            this.totalPages
        ) {

            return;

        }


        this.currentPage++;

        this.updatePagination();

        this.scrollToTop();

    }


    onPageSizeChange(): void {

        this.currentPage = 1;

        this.updatePagination();

    }


    private scrollToTop(): void {

        window.scrollTo({

            top: 0,

            behavior: 'smooth'

        });

    }


    // ============================================================
    // INFORMATIONS PAGINATION
    // ============================================================

    get paginationStart(): number {

        if (
            this.totalItems === 0
        ) {

            return 0;

        }


        return (
            (this.currentPage - 1) *
            this.pageSize
        ) + 1;

    }


    get paginationEnd(): number {

        return Math.min(
            this.currentPage *
                this.pageSize,
            this.totalItems
        );

    }


    // ============================================================
    // PRIX
    // ============================================================

    formatPrice(
        price: number
    ): string {

        return new Intl.NumberFormat(
            'fr-FR'
        ).format(
            price ?? 0
        ) + ' FCFA';

    }


    // ============================================================
    // IMAGE PRINCIPALE
    // ============================================================

    getMainImage(
        bundle: BundleResponse
    ): string | null {

        if (
            !bundle.images ||
            bundle.images.length === 0
        ) {

            return null;

        }


        const mainImage =
            bundle.images.find(
                image =>
                    image.main === true
            );


        return mainImage?.imageUrl ??
            bundle.images[0]?.imageUrl ??
            null;

    }


    // ============================================================
    // NOMBRE DE PRODUITS
    // ============================================================

    getProductCount(
        bundle: BundleResponse
    ): number {

        return bundle.items?.length ?? 0;

    }


    // ============================================================
    // STOCK
    // ============================================================

    getStockClass(
        stock: number
    ): string {

        if (
            stock <= 0
        ) {

            return [
                'bg-red-100',
                'text-red-700',
                'dark:bg-red-900/20',
                'dark:text-red-400'
            ].join(' ');

        }


        if (
            stock <= 5
        ) {

            return [
                'bg-orange-100',
                'text-orange-700',
                'dark:bg-orange-900/20',
                'dark:text-orange-400'
            ].join(' ');

        }


        return [
            'bg-green-100',
            'text-green-700',
            'dark:bg-green-900/20',
            'dark:text-green-400'
        ].join(' ');

    }


    getStockLabel(
        stock: number
    ): string {

        if (
            stock <= 0
        ) {

            return 'Rupture';

        }


        if (
            stock <= 5
        ) {

            return 'Stock faible';

        }


        return 'Disponible';

    }


    // ============================================================
    // SUPPRESSION
    // ============================================================

    deleteBundle(
        bundle: BundleResponse
    ): void {

        const confirmed =
            confirm(
                `Voulez-vous vraiment supprimer le pack "${bundle.name}" ?`
            );


        if (!confirmed) {

            return;

        }


        this.deletingBundleId =
            bundle.id;


        this.bundleService
            .deleteBundle(bundle.id)
            .subscribe({

                next: () => {

                    this.bundles =
                        this.bundles.filter(
                            item =>
                                item.id !==
                                bundle.id
                        );


                    this.deletingBundleId =
                        null;


                    this.applyFilters();

                },

                error: (error) => {

                    console.error(
                        'Erreur suppression pack :',
                        error
                    );


                    this.deletingBundleId =
                        null;


                    alert(
                        error?.error?.message ??
                        'Impossible de supprimer le pack.'
                    );

                }

            });

    }

}
