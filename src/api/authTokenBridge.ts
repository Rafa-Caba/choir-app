export type LogoutFn = () => Promise<void> | void;

type GetTokenFn = () => string | null;
type SetTokenFn = (token: string | null) => void;

let getAccessTokenFn: GetTokenFn = () => null;
let getRefreshTokenFn: GetTokenFn = () => null;
let setAccessTokenFn: SetTokenFn = () => { };
let logoutFn: LogoutFn = () => { };

export const registerAuthBridge = (opts: {
    getAccessToken: GetTokenFn;
    getRefreshToken: GetTokenFn;
    setAccessToken: SetTokenFn;
    logout: LogoutFn;
}) => {
    getAccessTokenFn = opts.getAccessToken;
    getRefreshTokenFn = opts.getRefreshToken;
    setAccessTokenFn = opts.setAccessToken;
    logoutFn = opts.logout;
};

export const authBridge = {
    getAccessToken: () => getAccessTokenFn(),
    getRefreshToken: () => getRefreshTokenFn(),
    setAccessToken: (token: string | null) => setAccessTokenFn(token),
    logout: () => logoutFn(),
};
