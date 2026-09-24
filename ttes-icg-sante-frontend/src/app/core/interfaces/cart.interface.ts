export interface Cart {
    id: number;
    total: number;
    items: CartItem[];
}

export interface CartItemRequest {
    productId?: number;
    bundleId?: number;
    quantity: number;
}

export interface CartItem {
    id: number;

    productId?: number;
    productName?: string;

    bundleId?: number;
    bundleName?: string;

    quantity: number;

    price: number;

    imageUrl?: string;

    subtotal: number;
}

export interface CartResponse {
    id: number;
    items: CartItem[];
    total: number;
}

export interface AddCartItemRequest {
    productId?: number;
    bundleId?: number;
    quantity: number;
}