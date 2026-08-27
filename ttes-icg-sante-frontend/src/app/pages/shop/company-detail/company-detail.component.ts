import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';

import {
    ActivatedRoute,
    RouterModule
} from '@angular/router';

import {
    CompanyService
} from '../../../core/services/company.service';

import {
    CompanyResponse
} from '../../../core/interfaces/company-response.interface';

import {
    ProductResponse
} from '../../../core/interfaces/product-response.interface';


@Component({
    selector: 'app-company-detail',

    standalone: true,

    imports: [
        CommonModule,
        RouterModule
    ],

    templateUrl: './company-detail.component.html'
})
export class CompanyDetailComponent
    implements OnInit {


    private route =
        inject(ActivatedRoute);

    private companyService =
        inject(CompanyService);


    // =====================================================
    // DONNEES
    // =====================================================

    company: CompanyResponse | null = null;

    products: ProductResponse[] = [];


    // =====================================================
    // ETAT
    // =====================================================

    loading = true;

    error = '';


    // =====================================================
    // INIT
    // =====================================================

    ngOnInit(): void {

        const id =
            this.route.snapshot.paramMap.get('id');


        if (!id) {

            this.error =
                'Entreprise introuvable.';

            this.loading = false;

            return;
        }


        this.loadCompany(
            Number(id)
        );

    }


    // =====================================================
    // CHARGER ENTREPRISE
    // =====================================================

    loadCompany(
        companyId: number
    ): void {

        this.loading = true;

        this.error = '';


        // -----------------------------------------------
        // DETAIL ENTREPRISE
        // -----------------------------------------------

        this.companyService
            .getCompany(companyId)
            .subscribe({

                next: (company) => {

                    console.log(
                        'Entreprise :',
                        company
                    );

                    this.company =
                        company;


                    // -----------------------------------
                    // CHARGER SES PRODUITS
                    // -----------------------------------

                    this.loadProducts(
                        companyId
                    );

                },


                error: (error) => {

                    console.error(
                        'Erreur entreprise :',
                        error
                    );

                    this.error =
                        error?.error?.message ??
                        'Impossible de charger l’entreprise.';

                    this.loading = false;

                }

            });

    }


    // =====================================================
    // CHARGER PRODUITS
    // =====================================================

    loadProducts(
        companyId: number
    ): void {

        this.companyService
            .getCompanyProducts(companyId)
            .subscribe({

                next: (products) => {

                    console.log(
                        'Produits entreprise :',
                        products
                    );

                    this.products =
                        products;

                    this.loading = false;

                },


                error: (error) => {

                    console.error(
                        'Erreur produits :',
                        error
                    );

                    // L'entreprise existe toujours,
                    // mais ses produits n'ont pas pu être chargés.

                    this.products = [];

                    this.loading = false;

                }

            });

    }


    // =====================================================
    // FORMAT PRIX
    // =====================================================

    formatPrice(
        price: number
    ): string {

        return new Intl.NumberFormat(
            'fr-FR'
        ).format(price) + ' FCFA';

    }

}