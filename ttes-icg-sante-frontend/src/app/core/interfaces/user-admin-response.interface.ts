export interface UserAdminResponse {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    enabled: boolean;
    roles: string[];
    createdAt: string;
    updatedAt: string;
}