// src/services/audit.ts

import choirApi from '../api/choirApi';
import type { AuditScope, PaginatedAuditLogs } from '../types/audit';

interface AuditLogQuery {
    readonly scope: AuditScope;
    readonly page: number;
    readonly limit?: number;
    readonly choirId?: string;
    readonly operation?: string;
    readonly collection?: string;
}

export const getAuditLogs = async ({
    scope,
    page,
    limit = 20,
    choirId,
    operation,
    collection
}: AuditLogQuery): Promise<PaginatedAuditLogs> => {
    const path = scope === 'global' ? '/logs/platform' : '/logs';
    const response = await choirApi.get<PaginatedAuditLogs>(path, {
        params: {
            page,
            limit,
            choirId,
            operation,
            collection
        }
    });

    return response.data;
};
