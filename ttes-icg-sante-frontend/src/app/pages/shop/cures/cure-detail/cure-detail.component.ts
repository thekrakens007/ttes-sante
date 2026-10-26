import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CureService } from '../../../../core/services/cure.service';
import { Cure, CureProduct } from '../../../../core/models/cure.model';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';

@Component({
    selector: 'app-cure-detail',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './cure-detail.component.html'
})
export class CureDetailComponent implements OnInit {

    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private cureService = inject(CureService);
    private authService = inject(AuthService);
    private cartService = inject(CartService);

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
    // PANIER
    // ============================================================

    addingToCart = false;
    cartMessage = '';
    cartError = '';


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
    // STOCK
    // ============================================================

    /**
     * Une cure n'a pas de stock propre : le backend peut fournir
     * availableStock (nombre de cures réalisables). S'il est absent,
     * on ne bloque pas côté client.
     */
    isOutOfStock(): boolean {
        const stock = this.cure?.availableStock;

        return stock !== undefined && stock !== null && stock <= 0;
    }


    // ============================================================
    // AJOUT AU PANIER
    // ============================================================

    addToCart(): void {
        if (!this.cure || this.cure.id === undefined) {
            return;
        }

        // Non connecté : redirection vers la connexion
        if (!this.authService.isLoggedIn()) {
            this.router.navigate(['/signin'], {
                queryParams: { returnUrl: this.router.url }
            });
            return;
        }

        if (this.isOutOfStock()) {
            this.cartError = 'Cette cure est actuellement en rupture de stock.';
            this.cartMessage = '';
            return;
        }

        // Éviter le double clic
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

                // Session expirée
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
    // PRIX
    // ============================================================

    formatPrice(price?: number | null): string {
        return (
            new Intl.NumberFormat('fr-FR').format(price ?? 0) +
            ' FCFA'
        );
    }
}