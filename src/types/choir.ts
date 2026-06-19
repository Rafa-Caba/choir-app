export interface Choir {
    id: string;
    name: string;
    code: string;

    description?: string;
    logoUrl?: string;
    logoPublicId?: string;

    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface PaginatedChoirResponse {
    choirs: Choir[];
    currentPage: number;
    totalPages: number;
    totalChoirs: number;
}

export interface CreateChoirPayload {
    name: string;
    code: string;
    description?: string;
    isActive?: boolean;

    file?: File;
    imageUri?: string;
}
