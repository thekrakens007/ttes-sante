import { BundleItemResponse } from './bundle-item-response.interface';
import { BundleImageResponse } from './bundle-image-response.interface';

export interface BundleResponse {
    id: number;
    name: string;
    description: string;
    price: number;
    active: boolean;
    stock: number;
    items: BundleItemResponse[];
    images: BundleImageResponse[];
    createdAt: string;
    updatedAt: string;
}