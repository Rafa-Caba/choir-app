// src/types/audit.ts

import type { UserRole } from './auth';
import type { JsonValue } from './json';

export type AuditScope = 'global' | 'tenant';

export interface AuditUserSummary {
    readonly id: string;
    readonly name: string;
    readonly username: string;
    readonly role: UserRole;
}

export interface AuditLogEntry {
    readonly id: string;
    readonly action: string;
    readonly operation: string;
    readonly collectionName: string;
    readonly referenceId: string;
    readonly actorUserId: string;
    readonly actor: AuditUserSummary | null;
    readonly actorRole: UserRole | null;
    readonly targetChoirId: string;
    readonly targetUserId: string | null;
    readonly targetUser: AuditUserSummary | null;
    readonly description: string;
    readonly before: JsonValue | null;
    readonly after: JsonValue | null;
    readonly changes: JsonValue | null;
    readonly ipAddress: string;
    readonly userAgent: string;
    readonly deviceId: string;
    readonly timestamp: string;
    readonly createdAt: string;
}

export interface PaginatedAuditLogs {
    readonly logs: readonly AuditLogEntry[];
    readonly currentPage: number;
    readonly totalPages: number;
    readonly totalLogs: number;
}
