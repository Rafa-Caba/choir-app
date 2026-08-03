// src/types/auth.ts

import type { Theme } from './theme';

export type UserRole = 'ADMIN' | 'EDITOR' | 'VIEWER' | 'USER' | 'SUPER_ADMIN';

export interface AuthenticatedChoir {
    readonly id: string;
    readonly name: string;
    readonly code: string;
    readonly isActive: boolean;
}

export interface User {
    readonly id: string;
    readonly name: string;
    readonly username: string;
    readonly email: string;
    readonly role: UserRole;
    readonly choirId: string | null;
    readonly isActive: boolean;
    readonly mustChangePassword: boolean;
    readonly sessionVersion: number;
    readonly imageUrl?: string;
    readonly cachedImageUrl?: string | null;
    readonly imagePublicId?: string;
    readonly instrument?: string;
    readonly instrumentId?: string | null;
    readonly instrumentLabel?: string;
    readonly voice?: boolean;
    readonly bio?: string;
    readonly themeId?: string | Theme | null;
    readonly lastAccess?: string;
    readonly createdAt?: string;
    readonly updatedAt?: string;
}

export interface AuthSessionResponse {
    readonly accessToken: string;
    readonly refreshToken: string;
    readonly sessionId: string;
    readonly user: User;
    readonly choir: AuthenticatedChoir | null;
    readonly requiresPasswordChange: boolean;
}

export interface CurrentSessionResponse {
    readonly user: User;
    readonly choir: AuthenticatedChoir | null;
    readonly targetChoir: AuthenticatedChoir | null;
    readonly effectiveChoirId: string | null;
    readonly requiresPasswordChange: boolean;
}

export interface TenantLoginPayload {
    readonly choirCode: string;
    readonly identifier: string;
    readonly password: string;
}

export interface PlatformLoginPayload {
    readonly identifier: string;
    readonly password: string;
}

export interface ChangePasswordPayload {
    readonly currentPassword: string;
    readonly newPassword: string;
}

export interface LogoutPayload {
    readonly refreshToken: string;
    readonly deviceId?: string;
}

export interface UserResponse {
    readonly user: User;
}

export interface UpdateProfileInput {
    readonly name?: string;
    readonly username?: string;
    readonly email?: string;
    readonly instrumentId?: string | null;
    readonly instrumentLabel?: string;
    readonly voice?: boolean;
    readonly bio?: string;
}

export type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';
export type ConnectionMode = 'online' | 'offline' | 'none';
