
export type CureType = 'PREVENTIVE' | 'CURATIVE';

export interface Cure {
    id?: number;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    type: CureType;
    price: number;
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CureRequest {
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    type: CureType;
    price: number;
    active?: boolean | null;
}
