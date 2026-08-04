// src/store/useAuthStore.ts

import axios from 'axios';
import { create } from 'zustand';
import { registerAuthBridge } from '../api/authTokenBridge';
import {
    changePassword,
    getApiErrorMessage,
    getCurrentSession,
    getUserProfile,
    loginPlatform,
    loginTenant,
    logoutUser,
    updateProfile
} from '../services/auth';
import { getOrCreateDeviceId } from '../services/deviceIdentity';
import { clearLocalSessionData } from '../services/sessionCleanup';
import { cacheRemoteMedia } from '../storage/mediaCache';
import {
    clearSecureSession,
    loadSecureSession,
    saveSecureSession
} from '../storage/secureSessionStorage';
import {
    clearLegacyStorage,
    loadLastChoirCode,
    loadPersistedSessionContext,
    saveLastChoirCode,
    savePersistedSessionContext
} from '../storage/tenantStorage';
import type {
    AuthSessionResponse,
    AuthStatus,
    AuthenticatedChoir,
    ChangePasswordPayload,
    ConnectionMode,
    PlatformLoginPayload,
    TenantLoginPayload,
    UpdateProfileInput,
    User
} from '../types/auth';
import type { TenantStorageContext } from '../types/sync';

const OFFLINE_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const AUTH_STORAGE_TIMEOUT_MS = 8000;

const withTimeout = async <T>(
    operation: Promise<T>,
    timeoutMs: number,
    message: string
): Promise<T> => {
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    const timeout = new Promise<never>((_resolve, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error(message)), timeoutMs);
    });

    try {
        return await Promise.race([operation, timeout]);
    } finally {
        if (timeoutHandle) {
            clearTimeout(timeoutHandle);
        }
    }
};

const clearSessionDataSafely = async (
    context: TenantStorageContext | null
): Promise<void> => {
    await Promise.allSettled([
        withTimeout(
            clearSecureSession(),
            AUTH_STORAGE_TIMEOUT_MS,
            'Secure session cleanup timed out'
        ),
        withTimeout(
            clearLocalSessionData(context),
            AUTH_STORAGE_TIMEOUT_MS,
            'Local session cleanup timed out'
        )
    ]);
};

interface AuthState {
    token: string | null;
    refreshToken: string | null;
    sessionId: string | null;
    user: User | null;
    choir: AuthenticatedChoir | null;
    requiresPasswordChange: boolean;
    status: AuthStatus;
    connectionMode: ConnectionMode;
    loading: boolean;
    errorMessage: string | null;
    lastChoirCode: string;

    login: (payload: TenantLoginPayload) => Promise<boolean>;
    loginAsPlatform: (payload: PlatformLoginPayload) => Promise<boolean>;
    completePasswordChange: (payload: ChangePasswordPayload) => Promise<boolean>;
    logout: () => Promise<void>;
    expireSession: () => Promise<void>;
    checkAuth: () => Promise<void>;
    clearError: () => void;
    updateUserProfile: (data: UpdateProfileInput, imageUri?: string) => Promise<boolean>;
    applySession: (session: AuthSessionResponse, connectionMode?: ConnectionMode) => Promise<void>;
    replaceUser: (user: User) => Promise<void>;
    getTenantContext: () => TenantStorageContext | null;
}

const mergeUser = (current: User | null, incoming: User): User => {
    if (!current || current.id !== incoming.id) {
        return incoming;
    }

    return {
        ...current,
        ...incoming
    };
};

const getContext = (
    user: User | null,
    choir: AuthenticatedChoir | null
): TenantStorageContext | null => {
    const choirId = choir?.id ?? user?.choirId ?? null;

    if (!user || !choirId) {
        return null;
    }

    return {
        choirId,
        userId: user.id
    };
};

const hydrateUserMedia = async (
    user: User,
    choir: AuthenticatedChoir | null
): Promise<User> => {
    const context = getContext(user, choir);

    if (!context || !user.imageUrl) {
        return user;
    }

    return {
        ...user,
        cachedImageUrl: await cacheRemoteMedia(
            context,
            'users',
            user.imageUrl
        )
    };
};

export const useAuthStore = create<AuthState>((set, get) => ({
    token: null,
    refreshToken: null,
    sessionId: null,
    user: null,
    choir: null,
    requiresPasswordChange: false,
    status: 'checking',
    connectionMode: 'none',
    loading: false,
    errorMessage: null,
    lastChoirCode: '',

    applySession: async (session, connectionMode = 'online') => {
        const previousContext = get().getTenantContext();
        const nextContext = getContext(session.user, session.choir);
        const changedTenant = previousContext && nextContext && (
            previousContext.choirId !== nextContext.choirId ||
            previousContext.userId !== nextContext.userId
        );

        if (changedTenant) {
            await clearLocalSessionData(previousContext);
        }

        const currentUser = get().user;
        const mergedUser = mergeUser(currentUser, session.user);
        const user = await hydrateUserMedia(mergedUser, session.choir);

        await saveSecureSession({
            accessToken: session.accessToken,
            refreshToken: session.refreshToken,
            sessionId: session.sessionId,
            userId: user.id
        });

        if (session.choir?.code) {
            await saveLastChoirCode(session.choir.code);
        }

        await savePersistedSessionContext({
            user,
            choir: session.choir,
            requiresPasswordChange: session.requiresPasswordChange,
            metadata: {
                userId: user.id,
                choirId: session.choir?.id ?? user.choirId,
                validatedAt: new Date().toISOString()
            }
        });

        set({
            token: session.accessToken,
            refreshToken: session.refreshToken,
            sessionId: session.sessionId,
            user,
            choir: session.choir,
            requiresPasswordChange: session.requiresPasswordChange,
            status: 'authenticated',
            connectionMode,
            loading: false,
            errorMessage: null,
            lastChoirCode: session.choir?.code ?? get().lastChoirCode
        });
    },

    login: async (payload) => {
        set({ loading: true, errorMessage: null });

        try {
            const session = await loginTenant({
                choirCode: payload.choirCode.trim().toLowerCase(),
                identifier: payload.identifier.trim(),
                password: payload.password
            });
            await get().applySession(session);

            if (!session.requiresPasswordChange) {
                try {
                    await get().replaceUser(await getUserProfile());
                } catch {
                    // The authenticated session remains valid even if profile enrichment fails.
                }
            }

            return true;
        } catch (error) {
            set({
                loading: false,
                status: 'unauthenticated',
                connectionMode: 'none',
                errorMessage: error instanceof Error
                    ? getApiErrorMessage(error)
                    : 'No fue posible iniciar sesión'
            });
            return false;
        }
    },

    loginAsPlatform: async (payload) => {
        set({ loading: true, errorMessage: null });

        try {
            const session = await loginPlatform(payload);
            await get().applySession(session);
            return true;
        } catch (error) {
            set({
                loading: false,
                status: 'unauthenticated',
                connectionMode: 'none',
                errorMessage: error instanceof Error
                    ? getApiErrorMessage(error)
                    : 'No fue posible iniciar sesión de plataforma'
            });
            return false;
        }
    },

    completePasswordChange: async (payload) => {
        set({ loading: true, errorMessage: null });

        try {
            const session = await changePassword(payload);
            await get().applySession(session);
            return true;
        } catch (error) {
            set({
                loading: false,
                errorMessage: error instanceof Error
                    ? getApiErrorMessage(error)
                    : 'No fue posible cambiar la contraseña'
            });
            return false;
        }
    },

    logout: async () => {
        const { refreshToken, token } = get();
        const context = get().getTenantContext();
        const serverLogout = async (): Promise<void> => {
            if (!refreshToken || !token) {
                return;
            }

            const deviceId = await getOrCreateDeviceId();
            await logoutUser({
                refreshToken,
                accessToken: token,
                deviceId
            });
        };

        set({
            token: null,
            refreshToken: null,
            sessionId: null,
            user: null,
            choir: null,
            requiresPasswordChange: false,
            status: 'unauthenticated',
            connectionMode: 'none',
            errorMessage: null,
            loading: false
        });

        await Promise.allSettled([
            serverLogout(),
            clearSessionDataSafely(context)
        ]);
    },

    expireSession: async () => {
        const context = get().getTenantContext();

        set({
            token: null,
            refreshToken: null,
            sessionId: null,
            user: null,
            choir: null,
            requiresPasswordChange: false,
            status: 'unauthenticated',
            connectionMode: 'none',
            errorMessage: 'Tu sesión expiró. Inicia sesión nuevamente.',
            loading: false
        });

        await clearSessionDataSafely(context);
    },

    checkAuth: async () => {
        set({
            status: 'checking',
            loading: true,
            errorMessage: null
        });

        try {
            await withTimeout(
                clearLegacyStorage(),
                AUTH_STORAGE_TIMEOUT_MS,
                'Legacy storage cleanup timed out'
            );

            const [secureSession, persisted, lastChoirCode] = await withTimeout(
                Promise.all([
                    loadSecureSession(),
                    loadPersistedSessionContext(),
                    loadLastChoirCode()
                ]),
                AUTH_STORAGE_TIMEOUT_MS,
                'Session storage loading timed out'
            );

            set({ lastChoirCode });

            if (!secureSession) {
                const staleContext = persisted?.metadata.choirId
                    ? {
                        choirId: persisted.metadata.choirId,
                        userId: persisted.metadata.userId
                    }
                    : null;

                await Promise.allSettled([
                    withTimeout(
                        clearLocalSessionData(staleContext),
                        AUTH_STORAGE_TIMEOUT_MS,
                        'Stale session cleanup timed out'
                    )
                ]);

                set({
                    status: 'unauthenticated',
                    connectionMode: 'none',
                    loading: false
                });
                return;
            }

            set({
                token: secureSession.accessToken,
                refreshToken: secureSession.refreshToken,
                sessionId: secureSession.sessionId
            });

            try {
                const currentSession = await getCurrentSession();
                let profile = currentSession.user;

                if (!currentSession.requiresPasswordChange) {
                    try {
                        profile = await getUserProfile();
                    } catch {
                        profile = currentSession.user;
                    }
                }

                const sessionResponse: AuthSessionResponse = {
                    accessToken: get().token ?? secureSession.accessToken,
                    refreshToken: get().refreshToken ?? secureSession.refreshToken,
                    sessionId: get().sessionId ?? secureSession.sessionId,
                    user: profile,
                    choir: currentSession.choir,
                    requiresPasswordChange: currentSession.requiresPasswordChange
                };
                await get().applySession(sessionResponse, 'online');
            } catch (error) {
                const isAuthorizationFailure = axios.isAxiosError(error) &&
                    (error.response?.status === 401 || error.response?.status === 403);
                const persistedAge = persisted
                    ? Date.now() - Date.parse(persisted.metadata.validatedAt)
                    : Number.POSITIVE_INFINITY;
                const canRestoreOffline = Boolean(
                    persisted &&
                    persisted.metadata.userId === secureSession.userId &&
                    persistedAge <= OFFLINE_SESSION_MAX_AGE_MS &&
                    !isAuthorizationFailure
                );

                if (canRestoreOffline && persisted) {
                    set({
                        token: secureSession.accessToken,
                        refreshToken: secureSession.refreshToken,
                        sessionId: secureSession.sessionId,
                        user: persisted.user,
                        choir: persisted.choir,
                        requiresPasswordChange: persisted.requiresPasswordChange,
                        status: 'authenticated',
                        connectionMode: 'offline',
                        loading: false,
                        errorMessage: null
                    });
                    return;
                }

                const failedContext = persisted?.metadata.choirId
                    ? {
                        choirId: persisted.metadata.choirId,
                        userId: persisted.metadata.userId
                    }
                    : null;
                await clearSessionDataSafely(failedContext);

                const apiUnavailable = axios.isAxiosError(error) &&
                    (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK');

                set({
                    token: null,
                    refreshToken: null,
                    sessionId: null,
                    user: null,
                    choir: null,
                    requiresPasswordChange: false,
                    status: 'unauthenticated',
                    connectionMode: 'none',
                    errorMessage: apiUnavailable
                        ? 'No fue posible contactar al API para validar la sesión. Verifica que el servidor esté activo.'
                        : 'Tu sesión ya no es válida. Inicia sesión nuevamente.',
                    loading: false
                });
            }
        } catch {
            await clearSessionDataSafely(null);
            set({
                token: null,
                refreshToken: null,
                sessionId: null,
                user: null,
                choir: null,
                requiresPasswordChange: false,
                status: 'unauthenticated',
                connectionMode: 'none',
                errorMessage: 'No fue posible restaurar la sesión local. Inicia sesión nuevamente.',
                loading: false
            });
        }
    },

    clearError: () => set({ errorMessage: null }),

    updateUserProfile: async (data, imageUri) => {
        set({ loading: true, errorMessage: null });

        try {
            await get().replaceUser(await updateProfile(data, imageUri));
            set({ loading: false });
            return true;
        } catch (error) {
            set({
                loading: false,
                errorMessage: error instanceof Error
                    ? getApiErrorMessage(error)
                    : 'No fue posible actualizar el perfil'
            });
            return false;
        }
    },

    replaceUser: async (incomingUser) => {
        const current = get();
        const user = await hydrateUserMedia(
            mergeUser(current.user, incomingUser),
            current.choir
        );

        set({ user });

        if (current.status === 'authenticated') {
            await savePersistedSessionContext({
                user,
                choir: current.choir,
                requiresPasswordChange: current.requiresPasswordChange,
                metadata: {
                    userId: user.id,
                    choirId: current.choir?.id ?? user.choirId,
                    validatedAt: new Date().toISOString()
                }
            });
        }
    },

    getTenantContext: () => getContext(get().user, get().choir)
}));

registerAuthBridge({
    getAccessToken: () => useAuthStore.getState().token,
    getRefreshToken: () => useAuthStore.getState().refreshToken,
    applySession: (session) => useAuthStore.getState().applySession(session),
    expireSession: () => useAuthStore.getState().expireSession()
});
