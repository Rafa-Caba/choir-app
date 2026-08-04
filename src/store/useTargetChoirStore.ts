// src/store/useTargetChoirStore.ts

import { create } from 'zustand';
import type { Choir } from '../types/choir';
import { registerTenantContextBridge } from '../api/tenantContextBridge';

export type PlatformViewMode = 'platform' | 'tenant';

interface TargetChoirState {
    readonly selectedChoir: Choir | null;
    readonly viewMode: PlatformViewMode;
    selectChoir: (choir: Choir) => void;
    enterChoir: (choir: Choir) => void;
    returnToPlatform: () => void;
    clearSelection: () => void;
}

export const useTargetChoirStore = create<TargetChoirState>((set) => ({
    selectedChoir: null,
    viewMode: 'platform',
    selectChoir: (choir) => set({ selectedChoir: choir }),
    enterChoir: (choir) => set({
        selectedChoir: choir,
        viewMode: 'tenant'
    }),
    returnToPlatform: () => set({ viewMode: 'platform' }),
    clearSelection: () => set({
        selectedChoir: null,
        viewMode: 'platform'
    })
}));

registerTenantContextBridge(
    () => useTargetChoirStore.getState().selectedChoir?.id ?? null
);
