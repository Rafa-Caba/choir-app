// src/query/queryClient.ts

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 15_000,
            gcTime: 5 * 60_000,
            refetchOnMount: true,
            refetchOnReconnect: true,
            refetchOnWindowFocus: false,
            structuralSharing: true
        },
        mutations: {
            retry: 0
        }
    }
});
