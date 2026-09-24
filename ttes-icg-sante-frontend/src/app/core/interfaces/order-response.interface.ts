export interface OrderItemResponse {

    id: number;

    productId?: number;

    productName?: string;

    bundleId?: number;

    bundleName?: string;

    quantity: number;

    price: number;

}


export interface OrderResponse {

    id: number;

    status: string;

    totalAmount: number;

    customerName: string;

    customerPhone: string;

    customerEmail: string;

    deliveryAddress: string;

    customerNote?: string;

    whatsappLink?: string;

    createdAt?: string;

    items: OrderItemResponse[];

}