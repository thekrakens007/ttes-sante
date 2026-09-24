import { BundleItemRequest } from './bundle-item-request.interface';
import { BundleImageRequest } from './bundle-image-request.interface';

export interface BundleRequest {
    name: string;
    description?: string;
    price: number;
    active?: boolean;
    items: BundleItemRequest[];
    images?: BundleImageRequest[];
}