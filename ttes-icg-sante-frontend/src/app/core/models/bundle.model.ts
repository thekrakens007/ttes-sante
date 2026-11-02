
export interface BundleResponse {
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    active: boolean;
    imageUrl?: string;

    products?: BundleProduct[];
    items?: BundleItem[];

    createdAt?: string;
    updatedAt?: string;
}

export interface BundleProduct {
    id: number;
    name: string;
    sku?: string;
    description?: string;
    brand?: string;
    activeIngredient?: string;
    dosage?: string;
    form?: string;
    ingredients?: string[];
    companyName?: string;
    companyId?: number;
    price?: number;
    stock?: number;
    quantity?: number;
    imageUrl?: string;

    categories?: string[];
    categoryNames?: string[];
    therapeuticAreas?: string[];
    therapeuticAreaNames?: string[];
}

export interface BundleItem {
    id?: number;
    quantity?: number;
    product: BundleProduct;
}
