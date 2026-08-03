// src/api/authTokenBridge.ts

import type { AuthSessionResponse } from '../types/auth';

export type ExpireSessionFn = () => Promise<void>;

type GetTokenFn = () => string | null;
type ApplySessionFn = (session: AuthSessionResponse) => Promise<void>;

let getAccessTokenFn: GetTokenFn = () => null;
let getRefreshTokenFn: GetTokenFn = () => null;
let applySessionFn: ApplySessionFn = async () => undefined;
let expireSessionFn: ExpireSessionFn = async () => undefined;

export const registerAuthBridge = (options: {
    readonly getAccessToken: GetTokenFn;
    readonly getRefreshToken: GetTokenFn;
    readonly applySession: ApplySessionFn;
    readonly expireSession: ExpireSessionFn;
}): void => {
    getAccessTokenFn = options.getAccessToken;
    getRefreshTokenFn = options.getRefreshToken;
    applySessionFn = options.applySession;
    expireSessionFn = options.expireSession;
};

export const authBridge = {
    getAccessToken: (): string | null => getAccessTokenFn(),
    getRefreshToken: (): string | null => getRefreshTokenFn(),
    applySession: (session: AuthSessionResponse): Promise<void> => applySessionFn(session),
    expireSession: (): Promise<void> => expireSessionFn()
};
