// src/providers/QueryProvider.tsx

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../query/queryClient';

interface QueryProviderProps {
    readonly children: React.ReactNode;
}

export const QueryProvider = ({ children }: QueryProviderProps) => (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
);
