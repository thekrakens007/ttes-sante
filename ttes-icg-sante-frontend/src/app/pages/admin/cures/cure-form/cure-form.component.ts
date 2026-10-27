import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
    FormBuilder,
    FormsModule,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CureService } from '../../../../core/services/cure.service';
import { ProductService } from '../../../../core/services/product.service';
import { Cure, CureProduct, CureRequest } from '../../../../core/models/cure.model';

interface ProductOption {
    id: number;
    name: string;
    price?: number | null;
    images?: Array<{
        imageUrl?: string | null;
        main?: boolean;
    }>;
}

interface SelectedCureItem {
    productId: number;
    productName: string;
    productImageUrl: string;
    unitPrice: number;
    quantity: number;
}

interface CureDraft {
    cureId: number | null;
    name: string;
    description: string;
    imageUrl: string;
    active: boolean;
    items: SelectedCureItem[];
}

@Component({
    selector: 'app-cure-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule
    ],
    templateUrl: './cure-form.component.html'
})
export class CureFormComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly cureService = inject(CureService);
    private readonly productService = inject(ProductService);

    private readonly DRAFT_KEY = 'cure-form-draft';

    cureId: number | null = null;
    isEditMode = false;
    loading = false;
    saving = false;
    errorMessage = '';
    successMessage = '';

    products: ProductOption[] = [];
    selectedItems: SelectedCureItem[] = [];

    form = this.fb.nonNullable.group({
        name: ['', [Validators.required, Validators.maxLength(180)]],
        description: ['', Validators.maxLength(10000)],
        imageUrl: ['', Validators.maxLength(1000)],
        active: [false]
    });

    // ============================================================
    // INITIALISATION
    // ============================================================

    ngOnInit(): void {
        this.cureId = Number(this.route.snapshot.paramMap.get('id')) || null;
        this.isEditMode = this.cureId !== null;

        // productIds n'est présent que lorsqu'on revient du sélecteur.
        const idsParam = this.route.snapshot.queryParamMap.get('productIds');
        const returnedIds =
            idsParam !== null ? this.parseProductIds(idsParam) : null;

        const draft = returnedIds !== null ? this.getDraft() : null;

        // Arrivée "normale" : on repart d'un brouillon vide.
        if (returnedIds === null) {
            this.clearDraft();
        }

        this.loading = true;

        this.productService.getProducts().subscribe({
            next: (products) => {
                this.products = products as ProductOption[];

                if (draft) {
                    this.restoreDraft(draft);
                    this.applySelectedProductIds(returnedIds ?? []);
                    this.loading = false;
                    return;
                }

                if (this.cureId !== null) {
                    this.loadCure(this.cureId, returnedIds);
                    return;
                }

                if (returnedIds !== null) {
                    this.applySelectedProductIds(returnedIds);
                }

                this.loading = false;
            },
            error: (error) => {
                console.error('Erreur de chargement des produits', error);
                this.errorMessage = 'Impossible de charger les produits.';
                this.loading = false;
            }
        });
    }

    loadCure(id: number, returnedIds: number[] | null = null): void {
        this.cureService.getAdminCure(id).subscribe({
            next: (cure: Cure) => {
                this.form.patchValue({
                    name: cure.name,
                    description: cure.description ?? '',
                    imageUrl: cure.imageUrl ?? '',
                    active: cure.active
                });

                this.selectedItems = (cure.items ?? []).map(
                    (item: CureProduct) => ({
                        productId: item.productId,
                        productName: item.productName,
                        productImageUrl: item.productImageUrl ?? '',
                        unitPrice: item.unitPrice ?? 0,
                        quantity: item.quantity
                    })
                );

                if (returnedIds !== null) {
                    this.applySelectedProductIds(returnedIds);
                }

                this.loading = false;
            },
            error: (error) => {
                console.error('Erreur de chargement de la cure', error);
                this.errorMessage = 'Impossible de charger cette cure.';
                this.loading = false;
            }
        });
    }

    // ============================================================
    // SELECTION DES PRODUITS (même logique que le pack)
    // ============================================================

    openProductSelector(): void {
        this.saveDraft();

        this.router.navigate(['/admin/products'], {
            queryParams: {
                bundleSelection: 'true',
                target: 'cure',
                returnMode: this.isEditMode ? 'edit' : 'new',
                bundleId: this.cureId ?? undefined,
                productIds: this.selectedItems
                    .map(item => item.productId)
                    .join(',')
            }
        });
    }

    /**
     * Aligne la liste des produits de la cure sur les ids reçus.
     * - produit déjà présent : on garde sa quantité
     * - nouveau produit : quantité 1
     * - produit absent des ids : retiré
     */
    private applySelectedProductIds(ids: number[]): void {
        const existing = new Map(
            this.selectedItems.map(item => [item.productId, item])
        );

        this.selectedItems = ids.flatMap((id): SelectedCureItem[] => {
            const kept = existing.get(id);

            if (kept) {
                return [kept];
            }

            const product = this.products.find(p => p.id === id);

            if (!product) {
                return [];
            }

            const image = product.images?.find(img => img.main)
                ?? product.images?.[0];

            return [{
                productId: product.id,
                productName: product.name,
                productImageUrl: image?.imageUrl ?? '',
                unitPrice: product.price ?? 0,
                quantity: 1
            }];
        });
    }

    removeProduct(productId: number): void {
        this.selectedItems = this.selectedItems.filter(
            item => item.productId !== productId
        );
    }

    updateQuantity(productId: number, value: string | number): void {
        const quantity = Math.max(1, Math.floor(Number(value) || 1));

        this.selectedItems = this.selectedItems.map(item =>
            item.productId === productId
                ? { ...item, quantity }
                : item
        );
    }

    get totalPrice(): number {
        return this.selectedItems.reduce(
            (total, item) => total + item.unitPrice * item.quantity,
            0
        );
    }

    formatPrice(price: number): string {
        return `${price.toLocaleString('fr-FR')} FCFA`;
    }

    // ============================================================
    // BROUILLON
    // ============================================================

    private saveDraft(): void {
        const draft: CureDraft = {
            cureId: this.cureId,
            name: this.form.controls.name.value,
            description: this.form.controls.description.value,
            imageUrl: this.form.controls.imageUrl.value,
            active: this.form.controls.active.value,
            items: this.selectedItems
        };

        try {
            sessionStorage.setItem(this.DRAFT_KEY, JSON.stringify(draft));
        } catch (err) {
            console.error('Erreur sauvegarde draft :', err);
        }
    }

    private getDraft(): CureDraft | null {
        try {
            const raw = sessionStorage.getItem(this.DRAFT_KEY);

            if (!raw) {
                return null;
            }

            const data = JSON.parse(raw);

            // Un brouillon appartient à une cure précise (ou à "nouvelle cure").
            if ((data.cureId ?? null) !== this.cureId) {
                return null;
            }

            return {
                cureId: data.cureId ?? null,
                name: data.name ?? '',
                description: data.description ?? '',
                imageUrl: data.imageUrl ?? '',
                active: data.active ?? false,
                items: data.items ?? []
            };
        } catch (err) {
            console.error('Erreur lecture draft :', err);
            return null;
        }
    }

    private restoreDraft(draft: CureDraft): void {
        this.form.patchValue({
            name: draft.name,
            description: draft.description,
            imageUrl: draft.imageUrl,
            active: draft.active
        });

        this.selectedItems = draft.items;
    }

    private clearDraft(): void {
        sessionStorage.removeItem(this.DRAFT_KEY);
    }

    private parseProductIds(value: string): number[] {
        return value
            .split(',')
            .map(id => Number(id))
            .filter(id => Number.isInteger(id) && id > 0);
    }

    // ============================================================
    // ENREGISTREMENT
    // ============================================================

    save(): void {
        this.errorMessage = '';
        this.successMessage = '';

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.errorMessage = 'Vérifie les champs obligatoires.';
            return;
        }

        if (this.selectedItems.length === 0) {
            this.errorMessage = 'Ajoute au moins un produit à la cure.';
            return;
        }

        const request: CureRequest = {
            name: this.form.controls.name.value.trim(),
            description: this.form.controls.description.value.trim(),
            imageUrl: this.form.controls.imageUrl.value.trim(),
            active: this.form.controls.active.value,
            items: this.selectedItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity
            }))
        };

        this.saving = true;

        const operation = this.isEditMode && this.cureId !== null
            ? this.cureService.updateCure(this.cureId, request)
            : this.cureService.createCure(request);

        operation.subscribe({
            next: () => {
                this.clearDraft();
                this.saving = false;
                this.router.navigate(['/admin/cures']);
            },
            error: (error) => {
                console.error('Erreur de sauvegarde de la cure', error);
                this.errorMessage =
                    error?.error?.message ?? 'Impossible d’enregistrer la cure.';
                this.saving = false;
            }
        });
    }

    cancel(): void {
        this.clearDraft();
        this.router.navigate(['/admin/cures']);
    }
}