
export interface CompanyRequest {
    name: string;
    description?: string;
    country?: string;
    website?: string;
    logoUrl?: string;
    categoryId?: number | null;
}
