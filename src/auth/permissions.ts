// src/auth/permissions.ts

import type { UserRole } from '../types/auth';

export interface PermissionSet {
    readonly isSuperAdmin: boolean;
    readonly canManageChoirs: boolean;
    readonly canManageUsers: boolean;
    readonly canManageContent: boolean;
    readonly canManageSettings: boolean;
    readonly canViewAuditLogs: boolean;
}

export const getPermissions = (role: UserRole | null | undefined): PermissionSet => {
    const isSuperAdmin = role === 'SUPER_ADMIN';
    const isAdmin = role === 'ADMIN';
    const isEditor = role === 'EDITOR';

    return {
        isSuperAdmin,
        canManageChoirs: isSuperAdmin,
        canManageUsers: isSuperAdmin || isAdmin,
        canManageContent: isSuperAdmin || isAdmin || isEditor,
        canManageSettings: isSuperAdmin || isAdmin,
        canViewAuditLogs: isSuperAdmin || isAdmin
    };
};

export const isSuperAdmin = (role: UserRole | null | undefined): boolean => {
    return getPermissions(role).isSuperAdmin;
};

export const canManageChoirs = (role: UserRole | null | undefined): boolean => {
    return getPermissions(role).canManageChoirs;
};

export const canManageUsers = (role: UserRole | null | undefined): boolean => {
    return getPermissions(role).canManageUsers;
};

export const canManageContent = (role: UserRole | null | undefined): boolean => {
    return getPermissions(role).canManageContent;
};

export const canManageSettings = (role: UserRole | null | undefined): boolean => {
    return getPermissions(role).canManageSettings;
};

export const canViewAuditLogs = (role: UserRole | null | undefined): boolean => {
    return getPermissions(role).canViewAuditLogs;
};
