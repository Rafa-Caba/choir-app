// src/store/useTargetChoirStore.ts

import { create } from 'zustand';
import { registerTenantContextBridge } from '../api/tenantContextBridge';
import type { Choir } from '../types/choir';

interface TargetChoirState {
    readonly selectedChoir: Choir | null;
    selectChoir: (choir: Choir) => void;
    clearSelection: () => void;
}

export const useTargetChoirStore = create<TargetChoirState>((set) => ({
    selectedChoir: null,
    selectChoir: (choir) => set({ selectedChoir: choir }),
    clearSelection: () => set({ selectedChoir: null })
}));

registerTenantContextBridge(() => useTargetChoirStore.getState().selectedChoir?.id ?? null);
