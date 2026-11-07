import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CureService } from '../../../../core/services/cure.service';
import { Cure } from '../../../../core/models/cure.model';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';

@Component({
    selector: 'app-cure-detail',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './cure-detail.component.html'
})
export class CureDetailComponent implements OnInit {

    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly cureService = inject(CureService);
    private readonly authService = inject(AuthService);
    private readonly cartService = inject(CartService);

    cure: Cure | null = null;

    loading = true;
    error = '';

    // ============================================================
    // IMAGE
    // ============================================================

    selectedImage: string | null = null;
    images: string[] = [];

    // ============================================================
    // PANIER
    // ============================================================

    addingToCart = false;
    cartMessage = '';
    cartError = '';

    // ============================================================
    // INITIALISATION
    // ============================================================

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));

        if (!Number.isInteger(id) || id <= 0) {
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

                // Une cure possède désormais sa propre image.
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
    // IMAGE
    // ============================================================

    private buildImages(cure: Cure): string[] {
        const imageUrl = cure.imageUrl?.trim();

        return imageUrl ? [imageUrl] : [];
    }

    selectImage(imageUrl: string): void {
        this.selectedImage = imageUrl;
    }

    // ============================================================
    // AJOUT AU PANIER
    // ============================================================

    addToCart(): void {
        if (!this.cure || this.cure.id === undefined) {
            return;
        }

        // L'utilisateur doit être connecté.
        if (!this.authService.isLoggedIn()) {
            this.router.navigate(['/signin'], {
                queryParams: { returnUrl: this.router.url }
            });
            return;
        }

        // Éviter les doubles clics.
        if (this.addingToCart) {
            return;
        }

        this.addingToCart = true;
        this.cartMessage = '';
        this.cartError = '';

        this.cartService.addCure(this.cure.id, 1).subscribe({
            next: () => {
                this.addingToCart = false;
                this.cartMessage = 'Cure ajoutée au panier.';
            },
            error: (error: any) => {
                console.error('Erreur ajout cure au panier :', error);

                this.addingToCart = false;

                // Session expirée.
                if (error?.status === 401) {
                    this.authService.logout();

                    this.router.navigate(['/signin'], {
                        queryParams: { returnUrl: this.router.url }
                    });

                    return;
                }

                this.cartError =
                    error?.error?.message ??
                    error?.error?.error ??
                    'Impossible d’ajouter la cure au panier.';
            }
        });
    }

    // ============================================================
    // TYPE DE CURE
    // ============================================================

    getTypeLabel(type: string): string {
        switch (type) {
            case 'PREVENTIVE':
                return 'Préventive';

            case 'CURATIVE':
                return 'Curative';

            default:
                return type;
        }
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