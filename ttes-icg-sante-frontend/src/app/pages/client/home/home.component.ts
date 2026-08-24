import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
    ProductService
} from '../../../core/services/product.service';

import { ProductCardComponent } from '../../../shared/components/client/product-card/product-card.component';
import {Product} from "../../../core/models/product.model";

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        CommonModule,
        ProductCardComponent
    ],
    templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {

    products: Product[] = [];

    loading = true;

    error = false;

    constructor(
        private productService: ProductService
    ) {}

    ngOnInit(): void {

        this.loadProducts();

    }

    loadProducts(): void {

        this.loading = true;
        this.error = false;

        this.productService
            .getProducts()
            .subscribe({

                next: (products) => {

                    this.products = products;

                    this.loading = false;

                    console.log(
                        'Produits chargés :',
                        products
                    );

                },

                error: (error) => {

                    console.error(
                        'Erreur lors du chargement des produits',
                        error
                    );

                    this.loading = false;
                    this.error = true;

                }

            });

    }

}