import { Product } from './product.model';

export interface GlobalSearchResponse {
  products: Product[];
  bundles: Bundle[];
}

export interface Bundle {
  id: number;
  name: string;
  description: string;
  price: number;
  active: boolean;
  stock: number;
  items: any[];
  images: BundleImage[];
  createdAt: string;
  updatedAt: string;
}

export interface BundleImage {
  id: number;
  imageUrl: string;
  main: boolean;
  displayOrder: number;
}
