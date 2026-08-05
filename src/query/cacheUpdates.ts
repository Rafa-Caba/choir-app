// src/query/cacheUpdates.ts

interface Identifiable {
    readonly id: string;
}

export const upsertById = <T extends Identifiable>(
    items: readonly T[] | undefined,
    incoming: T,
    placement: 'start' | 'end' = 'start'
): readonly T[] => {
    const current = items ?? [];
    const exists = current.some((item) => item.id === incoming.id);

    if (exists) {
        return current.map((item) => item.id === incoming.id ? incoming : item);
    }

    return placement === 'start'
        ? [incoming, ...current]
        : [...current, incoming];
};

export const removeById = <T extends Identifiable>(
    items: readonly T[] | undefined,
    id: string
): readonly T[] => (items ?? []).filter((item) => item.id !== id);
