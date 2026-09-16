export interface UserAdminResponse {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    enabled: boolean;

    roles: string[];
    roleIds: number[];

    createdAt: string;
    updatedAt: string;
}