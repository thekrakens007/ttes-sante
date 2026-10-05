export interface BundleItemResponse {
    id: number;
    productId: number;
    productName: string;
    sku: string;

    description?: string;
    brand?: string;
    activeIngredient?: string;
    dosage?: string;
    form?: string;
    ingredients?: string;

    unitPrice: number;
    quantity: number;
    availableStock: number;

    companyId?: number;
    companyName?: string;

    categoryIds?: number[];
    categories?: string[];

    therapeuticAreaIds?: number[];
    therapeuticAreas?: string[];
}
