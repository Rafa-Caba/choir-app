// src/types/choir.ts

export interface Choir {
    readonly id: string;
    readonly name: string;
    readonly code: string;
    readonly description?: string;
    readonly logoUrl?: string;
    readonly logoPublicId?: string;
    readonly isActive: boolean;
    readonly createdAt?: string;
    readonly updatedAt?: string;
}

export interface PaginatedChoirResponse {
    readonly choirs: readonly Choir[];
    readonly currentPage: number;
    readonly totalPages: number;
    readonly totalChoirs: number;
}

export interface CreateChoirPayload {
    readonly name: string;
    readonly code: string;
    readonly description?: string;
    readonly isActive?: boolean;
}
