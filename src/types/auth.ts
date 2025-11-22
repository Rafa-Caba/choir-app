export interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    role: 'ADMIN' | 'EDITOR' | 'USER';
    instrument: string;
    voice: boolean;
    bio?: string;
    imageUrl?: string;
    themeId?: number;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    role: string;
}

export interface LoginPayload {
    username: string; // Can be email or username
    password: string;
}

export interface RegisterPayload {
    name: string;
    username: string;
    email: string;
    password: string;
    instrument?: string;
}