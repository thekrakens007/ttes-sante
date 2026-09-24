import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { BundleService } from '../../../core/services/bundle.service';
import { BundleResponse } from '../../../core/interfaces/bundle-response.interface';

@Component({
    selector: 'app-bundles',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink
    ],
    templateUrl: './bundles.component.html'
})
export class BundlesComponent implements OnInit {

    private bundleService = inject(BundleService);

    bundles: BundleResponse[] = [];

    loading = true;
    error = '';

    ngOnInit(): void {
        this.loadBundles();
    }

    loadBundles(): void {
        this.loading = true;
        this.error = '';

        this.bundleService.getAdminBundles().subscribe({
            next: (bundles) => {
                this.bundles = bundles;
                this.loading = false;
            },
            error: (error) => {
                console.error('Erreur chargement packs :', error);

                this.error =
                    error?.error?.message ??
                    'Impossible de charger les packs.';

                this.loading = false;
            }
        });
    }

    formatPrice(price: number): string {
        return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
    }

    getMainImage(bundle: BundleResponse): string | null {
        if (!bundle.images || bundle.images.length === 0) {
            return null;
        }

        const mainImage = bundle.images.find(image => image.main);

        return mainImage?.imageUrl ??
            bundle.images[0]?.imageUrl ??
            null;
    }

    deleteBundle(bundle: BundleResponse): void {

        const confirmed = confirm(
            `Voulez-vous vraiment supprimer le pack "${bundle.name}" ?`
        );

        if (!confirmed) {
            return;
        }

        this.bundleService.deleteBundle(bundle.id).subscribe({
            next: () => {
                this.bundles = this.bundles.filter(
                    item => item.id !== bundle.id
                );
            },
            error: (error) => {
                console.error('Erreur suppression pack :', error);

                alert(
                    error?.error?.message ??
                    'Impossible de supprimer le pack.'
                );
            }
        });
    }
}