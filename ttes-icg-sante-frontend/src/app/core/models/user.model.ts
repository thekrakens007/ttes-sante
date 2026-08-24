export interface User {

    id: number;

    firstName: string;

    lastName: string;

    email: string;

    phone?: string;

    enabled: boolean;

    createdAt: string;

    updatedAt: string;

    roles: string[];

    // Si ton DTO backend contient ces champs
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;

}