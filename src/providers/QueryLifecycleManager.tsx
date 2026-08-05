// src/providers/QueryLifecycleManager.tsx

import React, { useEffect } from 'react';
import {
    AppState,
    type AppStateStatus,
    Platform
} from 'react-native';
import { focusManager } from '@tanstack/react-query';

interface QueryLifecycleManagerProps {
    readonly children: React.ReactNode;
}

const updateFocusState = (status: AppStateStatus): void => {
    if (Platform.OS !== 'web') {
        focusManager.setFocused(status === 'active');
    }
};

export const QueryLifecycleManager = ({ children }: QueryLifecycleManagerProps) => {
    useEffect(() => {
        updateFocusState(AppState.currentState);
        const subscription = AppState.addEventListener('change', updateFocusState);

        return () => subscription.remove();
    }, []);

    return <>{children}</>;
};
