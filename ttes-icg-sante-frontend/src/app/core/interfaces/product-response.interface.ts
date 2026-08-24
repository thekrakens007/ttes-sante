import { ProductImageResponse } from './product-image-response.interface';

export interface ProductResponse {
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
    images: ProductImageResponse[];
}