export type UserRole = 'ADMIN' | 'EDITOR' | 'VIEWER' | 'USER' | 'SUPER_ADMIN';

export interface User {
    id: string;

    name: string;
    username: string;
    email: string;
    role: UserRole;

    imageUrl?: string;
    imagePublicId?: string;

    // Instruments (new system)
    instrument?: string;
    instrumentId?: string | null;
    instrumentLabel?: string;

    voice?: boolean;
    bio?: string;

    themeId?: any;

    pushToken?: string | null;

    // Multi-choir context (from API/user record)
    choirId?: string;
    choirName?: string;
    choirCode?: string;

    lastAccess?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface AuthResponse {
    message?: string;
    accessToken: string;
    refreshToken: string;
    role: string;
    user: User;

    // Some backends also return these at top level
    choirId?: string;
    choirCode?: string;
}

export interface LoginPayload {
    username: string;
    password: string;

    // Optional. When omitted should default server-side (eroc1)
    choirCode?: string;
}

export interface RegisterPayload {
    name: string;
    username: string;
    email: string;
    password: string;

    // legacy (string) supported by API
    instrument?: string;

    // Optional. When omitted should default server-side (eroc1)
    choirCode?: string;
}
