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
  Router,
  RouterModule
} from '@angular/router';

import {
  SearchService
} from '../../core/services/search.service';

import {
  Bundle
} from '../../core/models/global-search.model';

import {
  Product
} from '../../core/models/product.model';


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

    this.route.queryParamMap.subscribe(params => {

      this.keyword =
        params.get('q')?.trim() || '';

      if (this.keyword) {
        this.search();
      }

    });
  }


  search(): void {

    if (!this.keyword) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.searchService
      .search(this.keyword)
      .subscribe({

        next: response => {

          this.products =
              response.products || [];

          this.bundles =
              response.bundles || [];

          this.loading = false;
        },

        error: error => {

          console.error(
            'Erreur recherche globale :',
            error
          );

          this.loading = false;

          this.error =
              'Impossible d’effectuer la recherche.';
        }

      });
  }


  openProduct(product: Product): void {

    this.router.navigate(
      ['/products', product.id]
    );
  }


  openBundle(bundle: Bundle): void {

    this.router.navigate(
      ['/bundles', bundle.id]
    );
  }


  get hasResults(): boolean {

    return this.products.length > 0
        || this.bundles.length > 0;
  }
}
