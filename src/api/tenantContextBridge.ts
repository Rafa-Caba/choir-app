// src/api/tenantContextBridge.ts

type GetTargetChoirId = () => string | null;

let getTargetChoirId: GetTargetChoirId = () => null;

export const registerTenantContextBridge = (getter: GetTargetChoirId): void => {
    getTargetChoirId = getter;
};

export const tenantContextBridge = {
    getTargetChoirId: (): string | null => getTargetChoirId()
};
