// src/hooks/query/useTenantQueryScope.ts

import { useAuthStore } from '../../store/useAuthStore';
import { useTargetChoirStore } from '../../store/useTargetChoirStore';
import type { TenantStorageContext } from '../../types/sync';

export interface TenantQueryScope {
    readonly tenantKey: string;
    readonly enabled: boolean;
    readonly context: TenantStorageContext | null;
}

const buildScope = (
    status: string,
    requiresPasswordChange: boolean,
    userId: string | null,
    role: string | null,
    userChoirId: string | null,
    targetChoirId: string | null
): TenantQueryScope => {
    const choirId = role === 'SUPER_ADMIN' ? targetChoirId : userChoirId;
    const enabled = status === 'authenticated' &&
        !requiresPasswordChange &&
        Boolean(userId) &&
        Boolean(choirId);
    const context = enabled && userId && choirId
        ? { userId, choirId }
        : null;

    return {
        tenantKey: context ? `${context.choirId}:${context.userId}` : 'no-tenant',
        enabled,
        context
    };
};

export const getTenantQueryScopeSnapshot = (): TenantQueryScope => {
    const { user, status, requiresPasswordChange } = useAuthStore.getState();
    const targetChoirId = useTargetChoirStore.getState().selectedChoir?.id ?? null;

    return buildScope(
        status,
        requiresPasswordChange,
        user?.id ?? null,
        user?.role ?? null,
        user?.choirId ?? null,
        targetChoirId
    );
};

export const useTenantQueryScope = (): TenantQueryScope => {
    const status = useAuthStore((state) => state.status);
    const requiresPasswordChange = useAuthStore(
        (state) => state.requiresPasswordChange
    );
    const userId = useAuthStore((state) => state.user?.id ?? null);
    const userRole = useAuthStore((state) => state.user?.role ?? null);
    const userChoirId = useAuthStore((state) => state.user?.choirId ?? null);
    const targetChoirId = useTargetChoirStore(
        (state) => state.selectedChoir?.id ?? null
    );

    return buildScope(
        status,
        requiresPasswordChange,
        userId,
        userRole,
        userChoirId,
        targetChoirId
    );
};
