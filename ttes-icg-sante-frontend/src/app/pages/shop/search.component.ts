import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import {
    ActivatedRoute,
    Router,
    RouterModule
} from '@angular/router';

import { SearchService } from '../../core/services/search.service';

import { Product } from '../../core/models/product.model';

import {
    GlobalSearchResponse,
    Bundle
} from '../../core/models/global-search.model';


@Component({
    selector: 'app-search',
    standalone: true,
    imports: [
        CommonModule,
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

    // =========================================================
    // RECHERCHE
    // =========================================================

    keyword = '';

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

    // =========================================================
    // INIT
    // =========================================================

    ngOnInit(): void {

        this.route.queryParams.subscribe(params => {

            const keyword =
                (params['q'] || '').trim();

            this.keyword = keyword;

            if (!keyword) {
                this.products = [];
                this.bundles = [];
                return;
            }

            this.search();
        });
    }

    // =========================================================
    // RECHERCHE GLOBALE
    // =========================================================

    search(): void {

        const keyword =
            this.keyword.trim();

        if (!keyword) {
            this.products = [];
            this.bundles = [];
            return;
        }

        this.loading = true;
        this.error = '';

        this.searchService
            .search(keyword, 0, 8)
            .subscribe({

                next: (
                    response: GlobalSearchResponse
                ) => {

                    this.products =
                        response.products ?? [];

                    this.bundles =
                        response.bundles ?? [];

                    this.loading = false;
                },

                error: (error) => {

                    console.error(
                        'Erreur recherche globale :',
                        error
                    );

                    this.products = [];
                    this.bundles = [];

                    this.error =
                        'Impossible de récupérer les résultats de recherche.';

                    this.loading = false;
                }
            });
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

    getProductImage(product: Product): string {

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

    getBundleImage(bundle: Bundle): string {

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
    // NAVIGATION PRODUIT
    // =========================================================

    openProduct(product: Product): void {

        if (!product?.id) {
            return;
        }

        this.router.navigate([
            '/products',
            product.id
        ]);
    }

    // =========================================================
    // NAVIGATION PACK
    // =========================================================

    openBundle(bundle: Bundle): void {

        if (!bundle?.id) {
            return;
        }

        this.router.navigate([
            '/bundles',
            bundle.id
        ]);
    }
}
