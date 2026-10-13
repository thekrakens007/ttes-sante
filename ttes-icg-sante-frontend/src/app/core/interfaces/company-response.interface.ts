
export interface CompanyResponse {
    id: number;
    name: string;
    description: string;
    country: string;
    website: string;
    logoUrl?: string | null;
    categoryId?: number | null;
    categoryName?: string | null;
}
