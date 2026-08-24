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
    description: string;
    brand: string;
    activeIngredient: string;
    dosage: string;
    form: string;
    price: number;
    requiresPrescription: boolean;
    companyName: string;
    stock: number;
    categories: string[];
    therapeuticAreas: string[];
    images: ProductImage[];
}