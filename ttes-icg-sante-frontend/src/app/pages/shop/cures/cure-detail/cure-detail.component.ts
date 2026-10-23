import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CureService } from '../../../../core/services/cure.service';
import { Cure, CureProduct } from '../../../../core/models/cure.model';

@Component({
    selector: 'app-cure-detail',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './cure-detail.component.html'
})
export class CureDetailComponent implements OnInit {

    private route = inject(ActivatedRoute);
    private cureService = inject(CureService);

    cure: Cure | null = null;

    loading = true;
    error = '';

    /**
     * Image affichée en grand dans la galerie.
     */
    selectedImage: string | null = null;

    /**
     * Images disponibles : image de la cure puis images
     * de ses produits (sans doublons).
     */
    images: string[] = [];


    // ============================================================
    // INIT
    // ============================================================

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));

        if (!id) {
            this.error = 'Identifiant de la cure invalide.';
            this.loading = false;
            return;
        }

        this.loadCure(id);
    }

    loadCure(id: number): void {
        this.loading = true;
        this.error = '';

        this.cureService.getCure(id).subscribe({
            next: (cure) => {
                this.cure = cure;
                this.images = this.buildImages(cure);
                this.selectedImage = this.images[0] ?? null;
                this.loading = false;
            },
            error: (error) => {
                console.error('Erreur chargement cure :', error);

                this.error =
                    error?.status === 404
                        ? 'Cette cure est introuvable ou n’est plus disponible.'
                        : error?.error?.message ??
                        'Impossible de charger la cure.';

                this.loading = false;
            }
        });
    }


    // ============================================================
    // IMAGES
    // ============================================================

    private buildImages(cure: Cure): string[] {
        const urls = [
            cure.imageUrl ?? '',
            ...(cure.items ?? []).map(item => item.productImageUrl ?? '')
        ].filter(url => !!url);

        return Array.from(new Set(urls));
    }

    selectImage(imageUrl: string): void {
        this.selectedImage = imageUrl;
    }


    // ============================================================
    // CONTENU
    // ============================================================

    get items(): CureProduct[] {
        return this.cure?.items ?? [];
    }

    get totalQuantity(): number {
        return this.items.reduce(
            (total, item) => total + (item.quantity ?? 0),
            0
        );
    }

    getSubtotal(item: CureProduct): number {
        return item.subtotal ?? (item.unitPrice ?? 0) * item.quantity;
    }


    // ============================================================
    // PRIX
    // ============================================================

    formatPrice(price?: number | null): string {
        return (
            new Intl.NumberFormat('fr-FR').format(price ?? 0) +
            ' FCFA'
        );
    }
}