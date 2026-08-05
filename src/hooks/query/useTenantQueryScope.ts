// src/hooks/query/useTenantQueryScope.ts

import { useAuthStore } from '../../store/useAuthStore';
import { useTargetChoirStore } from '../../store/useTargetChoirStore';

export interface TenantQueryScope {
    readonly tenantKey: string;
    readonly enabled: boolean;
}

export const getTenantQueryScopeSnapshot = (): TenantQueryScope => {
    const { user, status, requiresPasswordChange } = useAuthStore.getState();
    const targetChoirId = useTargetChoirStore.getState().selectedChoir?.id ?? null;
    const choirId = user?.role === 'SUPER_ADMIN' ? targetChoirId : user?.choirId ?? null;

    return {
        tenantKey: choirId ?? 'no-tenant',
        enabled: status === 'authenticated' && !requiresPasswordChange && choirId !== null
    };
};

export const useTenantQueryScope = (): TenantQueryScope => {
    const status = useAuthStore((state) => state.status);
    const requiresPasswordChange = useAuthStore((state) => state.requiresPasswordChange);
    const userRole = useAuthStore((state) => state.user?.role);
    const userChoirId = useAuthStore((state) => state.user?.choirId ?? null);
    const targetChoirId = useTargetChoirStore((state) => state.selectedChoir?.id ?? null);
    const choirId = userRole === 'SUPER_ADMIN' ? targetChoirId : userChoirId;

    return {
        tenantKey: choirId ?? 'no-tenant',
        enabled: status === 'authenticated' && !requiresPasswordChange && choirId !== null
    };
};
