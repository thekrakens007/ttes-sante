

export interface Cart {
    id: number;
    total: number;
    items: CartItem[];
}

export interface CartItemRequest {
    productId: number;
    quantity: number;
}


export interface CartItem {
    id: number;
    productId: number;
    productName: string;
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
    productId: number;
    quantity: number;
}
