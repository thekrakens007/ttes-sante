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

    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private searchService = inject(SearchService);

    keyword = '';

    products: Product[] = [];
    bundles: Bundle[] = [];

    loading = false;
    error = '';

    ngOnInit(): void {

        this.route.queryParams.subscribe(params => {

            const keyword = (params['q'] || '').trim();

            this.keyword = keyword;

            if (!keyword) {
                this.products = [];
                this.bundles = [];
                return;
            }

            this.search();
        });
    }

    /**
     * Effectue la recherche globale
     * produits + packs.
     */
    search(): void {

        const keyword = this.keyword.trim();

        if (!keyword) {
            return;
        }

        this.loading = true;
        this.error = '';

        this.searchService
            .search(keyword, 0, 8)
            .subscribe({

                next: (response: GlobalSearchResponse) => {

                    this.products = response.products || [];

                    this.bundles = response.bundles || [];

                    this.loading = false;
                },

                error: (err) => {

                    console.error(
                        'Erreur recherche globale :',
                        err
                    );

                    this.error =
                        'Impossible de récupérer les résultats de recherche.';

                    this.products = [];
                    this.bundles = [];

                    this.loading = false;
                }
            });
    }

    /**
     * Retourne l'image principale d'un produit.
     */
    getProductImage(product: Product): string {

        if (
            !product.images ||
            product.images.length === 0
        ) {
            return '/images/products/default-product.jpg';
        }

        const image = product.images[0];

        if (typeof image === 'string') {
            return image;
        }

        if (image?.imageUrl) {
            return image.imageUrl;
        }

        if (image?.url) {
            return image.url;
        }

        if (image?.path) {
            return image.path;
        }

        return '/images/products/default-product.jpg';
    }

    /**
     * Retourne l'image principale d'un pack.
     */
    getBundleImage(bundle: Bundle): string {

        if (
            !bundle.images ||
            bundle.images.length === 0
        ) {
            return '/images/products/default-product.jpg';
        }

        const mainImage = bundle.images.find(
            image => image.main
        );

        if (mainImage?.imageUrl) {
            return mainImage.imageUrl;
        }

        if (bundle.images[0]?.imageUrl) {
            return bundle.images[0].imageUrl;
        }

        return '/images/products/default-product.jpg';
    }

    /**
     * Ouvre la page d'un produit.
     */
    openProduct(productId: number): void {

        this.router.navigate([
            '/products',
            productId
        ]);
    }

    /**
     * Ouvre la page d'un pack.
     */
    openBundle(bundleId: number): void {

        this.router.navigate([
            '/bundles',
            bundleId
        ]);
    }
}
