export interface User {
    id: string;
    name: string;
    username: string;
    email: string;
    role: 'ADMIN' | 'EDITOR' | 'VIEWER';

    imageUrl?: string;
    imagePublicId?: string;

    instrument?: string;
    voice?: boolean;
    bio?: string;

    themeId?: any;
    pushToken?: string;
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
}

export interface LoginPayload {
    username: string;
    password: string;
}

export interface RegisterPayload {
    name: string;
    username: string;
    email: string;
    password: string;
    instrument?: string;
}