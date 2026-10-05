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

import { AdminService } from '../../../../core/services/admin.service';

import {
    Product
} from '../../../../core/models/product.model';


@Component({
    selector: 'app-product-table',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule
    ],
    templateUrl: './product-table.component.html'
})
export class ProductTableComponent
    implements OnInit {

    private adminService =
        inject(AdminService);

    private router =
        inject(Router);

    private route =
        inject(ActivatedRoute);


    products: Product[] = [];

    loading = true;

    errorMessage = '';

    searchTerm = '';


    currentPage = 0;

    pageSize = 8;

    totalPages = 0;

    totalElements = 0;

    pages: number[] = [];


    selectedProductIds =
        new Set<number>();


    isBundleSelectionMode = false;

    initialBundleProductIds: number[] = [];

    bundleReturnMode:
        'new' | 'edit' = 'new';

    bundleReturnId:
        number | null = null;


    ngOnInit(): void {

        this.route.queryParams.subscribe(
            params => {

                this.readBundleSelectionParams(
                    params
                );

                this.loadProducts();
            }
        );
    }


    private readBundleSelectionParams(
        params: any
    ): void {

        this.isBundleSelectionMode =
            params['bundleSelection'] === true ||
            params['bundleSelection'] === 'true';


        if (
            !this.isBundleSelectionMode
        ) {

            this.initialBundleProductIds = [];

            this.bundleReturnMode =
                'new';

            this.bundleReturnId =
                null;

            return;
        }


        const ids =
            this.parseProductIds(
                params['productIds']
            );


        this.selectedProductIds =
            new Set(ids);


        this.initialBundleProductIds =
            [...ids];


        this.bundleReturnMode =
            params['returnMode'] === 'edit'
                ? 'edit'
                : 'new';


        const bundleId =
            Number(
                params['bundleId']
            );


        this.bundleReturnId =
            Number.isInteger(bundleId) &&
            bundleId > 0
                ? bundleId
                : null;
    }


    private parseProductIds(
        value: any
    ): number[] {

        if (
            value === null ||
            value === undefined
        ) {
            return [];
        }


        const values =
            Array.isArray(value)
                ? value
                : [value];


        const ids: number[] = [];


        for (
            const valueItem of values
        ) {

            for (
                const part of
                String(valueItem).split(',')
            ) {

                const id =
                    Number(part);


                if (
                    Number.isInteger(id) &&
                    id > 0 &&
                    !ids.includes(id)
                ) {

                    ids.push(id);
                }
            }
        }


        return ids;
    }


    get selectedProductCount(): number {

        return this.selectedProductIds.size;
    }


    loadProducts(): void {

        this.loading = true;

        this.errorMessage = '';


        const keyword =
            this.searchTerm.trim();


        const request =
            keyword

                ? this.adminService
                    .searchProductsPaginated(
                        keyword,
                        this.currentPage,
                        this.pageSize
                    )

                : this.adminService
                    .getProductsPaginated(
                        this.currentPage,
                        this.pageSize
                    );


        request.subscribe({

            next:
                (response: any) => {

                    this.products =
                        response.content ?? [];

                    this.totalPages =
                        response.totalPages ?? 0;

                    this.totalElements =
                        response.totalElements ?? 0;

                    this.generatePages();

                    this.loading = false;
                },


            error:
                error => {

                    console.error(
                        'Erreur chargement produits :',
                        error
                    );

                    this.errorMessage =
                        'Impossible de charger les produits.';

                    this.products = [];

                    this.loading = false;
                }
        });
    }


    generatePages(): void {

        this.pages = [];


        for (
            let i = 0;
            i < this.totalPages;
            i++
        ) {

            this.pages.push(i);
        }
    }


    submitSearch(): void {

        this.currentPage = 0;

        this.loadProducts();
    }


    goToPage(
        page: number
    ): void {

        if (
            page < 0 ||
            page >= this.totalPages ||
            page === this.currentPage
        ) {
            return;
        }


        this.currentPage = page;

        this.loadProducts();
    }


    previousPage(): void {

        if (
            this.currentPage > 0
        ) {

            this.currentPage--;

            this.loadProducts();
        }
    }


    nextPage(): void {

        if (
            this.currentPage <
            this.totalPages - 1
        ) {

            this.currentPage++;

            this.loadProducts();
        }
    }


    toggleProductSelection(
        productId: number
    ): void {

        if (
            this.selectedProductIds.has(
                productId
            )
        ) {

            this.selectedProductIds.delete(
                productId
            );

        } else {

            this.selectedProductIds.add(
                productId
            );
        }
    }


    isProductSelected(
        productId: number
    ): boolean {

        return this.selectedProductIds.has(
            productId
        );
    }


    selectAllVisible(): void {

        for (
            const product of this.products
        ) {

            this.selectedProductIds.add(
                product.id
            );
        }
    }


    deselectAllVisible(): void {

        for (
            const product of this.products
        ) {

            this.selectedProductIds.delete(
                product.id
            );
        }
    }


    areAllVisibleSelected(): boolean {

        return (
            this.products.length > 0 &&
            this.products.every(
                product =>
                    this.selectedProductIds.has(
                        product.id
                    )
            )
        );
    }


    clearProductSelection(): void {

        this.selectedProductIds.clear();
    }


    continueToBundleCreation(): void {

        const productIds =
            Array.from(
                this.selectedProductIds
            );


        if (
            productIds.length === 0
        ) {
            return;
        }


        this.router.navigate(
            ['/admin/bundles/new'],
            {
                queryParams: {
                    productIds:
                        productIds.join(',')
                }
            }
        );
    }


    cancelBundleSelection(): void {

        const ids =
            [
                ...this.initialBundleProductIds
            ];


        this.navigateBackToBundle(
            ids
        );
    }


    confirmBundleSelection(): void {

        const ids =
            Array.from(
                this.selectedProductIds
            );


        this.navigateBackToBundle(
            ids
        );
    }


    private navigateBackToBundle(
        productIds: number[]
    ): void {

        const ids =
            [...new Set(productIds)];


        if (
            this.bundleReturnMode === 'edit' &&
            this.bundleReturnId !== null
        ) {

            this.router.navigate(
                [
                    '/admin/bundles/edit',
                    this.bundleReturnId
                ],
                {
                    queryParams: {
                        productIds:
                            ids.join(',')
                    }
                }
            );

            return;
        }


        this.router.navigate(
            ['/admin/bundles/new'],
            {
                queryParams: {
                    productIds:
                        ids.join(',')
                }
            }
        );
    }


    getMainImage(
        product: Product
    ): string {

        if (
            !product.images ||
            product.images.length === 0
        ) {
            return '';
        }


        const mainImage =
            product.images.find(
                image => image.main
            );


        return (
            mainImage?.imageUrl ??
            product.images[0]?.imageUrl ??
            ''
        );
    }


    getStockColor(
        stock: number
    ):
        'success' |
        'warning' |
        'error' {

        if (stock <= 0) {
            return 'error';
        }


        if (stock < 10) {
            return 'warning';
        }


        return 'success';
    }


    getStockLabel(
        stock: number
    ): string {

        if (stock <= 0) {
            return 'Rupture';
        }


        if (stock < 10) {
            return 'Stock faible';
        }


        return 'En stock';
    }


    deleteProduct(
        productId: number
    ): void {

        if (
            !confirm(
                'Êtes-vous sûr de vouloir supprimer ce produit ?'
            )
        ) {
            return;
        }


        this.adminService
            .deleteProduct(productId)
            .subscribe({

                next: () => {

                    this.selectedProductIds.delete(
                        productId
                    );

                    this.loadProducts();
                },


                error:
                    error => {

                        console.error(
                            'Erreur suppression produit :',
                            error
                        );

                        this.errorMessage =
                            'Impossible de supprimer le produit.';
                    }
            });
    }
}
