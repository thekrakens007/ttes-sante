export interface Cart {
    id: number;
    total: number;
    items: CartItem[];
}

export interface CartItemRequest {
    productId?: number;
    bundleId?: number;
    cureId?: number;
    quantity: number;
}

export interface CartItem {
    id: number;

    productId?: number;
    productName?: string;

    bundleId?: number;
    bundleName?: string;

    cureId?: number | null;
    cureName?: string | null;

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
    cureId?: number;
    quantity: number;
}