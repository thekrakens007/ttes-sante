import { Product } from './product.model';

export interface BundleImage {
    id?: number;
    imageUrl?: string;
    main?: boolean;
}

export interface Bundle {

    id: number;

    name: string;

    description?: string;

    price: number;

    stock?: number;

    active?: boolean;

    images?: BundleImage[];
}

export interface GlobalSearchResponse {

    products: Product[];

    bundles: Bundle[];

    page: number;

    size: number;

    totalProducts: number;

    totalBundles: number;

    totalProductPages: number;

    totalBundlePages: number;
}
