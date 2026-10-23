import { Injectable } from '@angular/core';

export interface CureSelectionItem {
    productId: number;
    productName: string;
    productImageUrl: string;
    unitPrice: number;
    quantity: number;
}

export interface CureFormDraft {
    name: string;
    description: string;
    imageUrl: string;
    active: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class CureSelectionService {
    private selectedItems = new Map<number, CureSelectionItem>();
    private productCache = new Map<number, CureSelectionItem>();
    private draft: CureFormDraft | null = null;

    cacheProduct(item: CureSelectionItem): void {
        const cached = this.productCache.get(item.productId);

        this.productCache.set(item.productId, {
            ...item,
            quantity: cached?.quantity ?? item.quantity ?? 1
        });
    }

    getCachedProduct(productId: number): CureSelectionItem | undefined {
        const item = this.productCache.get(productId);
        return item ? { ...item } : undefined;
    }

    setSelectedItems(items: CureSelectionItem[]): void {
        this.selectedItems.clear();

        for (const item of items) {
            if (item.productId > 0) {
                const copy = { ...item, quantity: Math.max(1, item.quantity || 1) };

                this.selectedItems.set(copy.productId, copy);
                this.cacheProduct(copy);
            }
        }
    }

    getSelectedItems(): CureSelectionItem[] {
        return Array.from(this.selectedItems.values()).map(item => ({ ...item }));
    }

    addProduct(item: CureSelectionItem): void {
        const existing = this.selectedItems.get(item.productId);

        const copy: CureSelectionItem = {
            ...item,
            quantity: existing?.quantity ?? Math.max(1, item.quantity || 1)
        };

        this.selectedItems.set(item.productId, copy);
        this.cacheProduct(copy);
    }

    removeProduct(productId: number): void {
        this.selectedItems.delete(productId);
    }

    updateQuantity(productId: number, quantity: number): void {
        const item = this.selectedItems.get(productId);

        if (!item) {
            return;
        }

        const updated = {
            ...item,
            quantity: Math.max(1, Math.floor(Number(quantity) || 1))
        };

        this.selectedItems.set(productId, updated);
        this.cacheProduct(updated);
    }

    setDraft(draft: CureFormDraft): void {
        this.draft = { ...draft };
    }

    getDraft(): CureFormDraft | null {
        return this.draft ? { ...this.draft } : null;
    }

    clearSelection(): void {
        this.selectedItems.clear();
    }

    clearDraft(): void {
        this.draft = null;
    }

    clearAll(): void {
        this.selectedItems.clear();
        this.productCache.clear();
        this.draft = null;
    }
}