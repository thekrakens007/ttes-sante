
export interface CureItemRequest {
    productId: number;
    quantity: number;
}

export interface CureProduct {
    productId: number;
    productName: string;
    productImageUrl?: string | null;
    quantity: number;
    unitPrice?: number | null;
    subtotal?: number | null;
}

export interface Cure {
    id?: number;
    availableStock?: number | null;   // nombre de cures réalisables avec le stock des produits
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    active: boolean;
    totalPrice?: number | null;
    items: CureProduct[];
}

export interface CureRequest {
    name: string;
    description: string;
    imageUrl: string;
    active: boolean;
    items: CureItemRequest[];
}
