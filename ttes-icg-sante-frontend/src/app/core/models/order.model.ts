export interface CreateOrderRequest {
    deliveryAddress: string;
    customerNote?: string;
}

export interface OrderItem {
    id: number;
    productName: string;
    quantity: number;
    price: number;
}

export interface Order {
    id: number;
    status: string;
    totalAmount: number;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    deliveryAddress: string;
    customerNote?: string;
    whatsappLink?: string;
    items: OrderItem[];
}