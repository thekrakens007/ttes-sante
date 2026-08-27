export interface ProductImage {
    id: number;
    imageUrl: string;
    main: boolean;
    displayOrder: number;
}

export interface Product {

    id: number;

    name: string;

    sku: string;

    description?: string;

    brand?: string;

    activeIngredient?: string;

    dosage?: string;

    form?: string;

    price: number;

    requiresPrescription?: boolean;

    stock: number;


    // ==========================================
    // ENTREPRISE
    // ==========================================

    companyId?: number;

    companyName?: string;


    // ==========================================
    // CATEGORIES
    // ==========================================

    categoryIds?: number[];

    categories?: string[];


    // ==========================================
    // DOMAINES THERAPEUTIQUES
    // ==========================================

    therapeuticAreaIds?: number[];

    therapeuticAreas?: string[];


    // ==========================================
    // IMAGES
    // ==========================================

    images?: ProductImage[];

}