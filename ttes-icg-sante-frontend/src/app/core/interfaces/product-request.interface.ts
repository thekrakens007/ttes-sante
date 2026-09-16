export interface ProductRequest {
    companyId: number;
    name: string;
    sku: string;
    description?: string;
    brand?: string;
    activeIngredient?: string;
    dosage?: string;
    form?: string;
    price: number;
    purchasePrice: number | null;

    ingredients: string;
    requiresPrescription: boolean;
    stock?: number;
    categoryIds: number[];
    therapeuticAreaIds: number[];
}

