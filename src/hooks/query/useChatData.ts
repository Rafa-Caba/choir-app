// src/hooks/query/useChatData.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import choirApi from '../../api/choirApi';
import {
    markChatReceipts,
    sendChatMessage,
    uploadChatMedia,
    type ChatAttachment
} from '../../services/chat';
import { syncCacheFirst } from '../../services/sync';
import type {
    ChatMessage,
    ChatReceiptStatus,
    ChatUserSummary,
    MessageType,
    NewMessagePayload,
    RawChatMessage
} from '../../types/chat';
import { normalizeChatMessage } from '../../utils/normalizeChatMessage';
import { queryKeys } from '../../query/queryKeys';
import { useChatStore } from '../../store/useChatStore';
import { upsertChatMessage } from '../../query/chatCache';
import { useTenantQueryScope } from './useTenantQueryScope';

interface ChatDirectoryResponse {
    readonly users: readonly ChatUserSummary[];
}

interface SendChatVariables {
    readonly text: string;
    readonly attachment?: ChatAttachment;
    readonly messageType?: MessageType;
    readonly replyToId?: string;
}

interface MarkChatReceiptsVariables {
    readonly messageIds: readonly string[];
    readonly status: ChatReceiptStatus;
}

const mapAttachmentType = (type: ChatAttachment['type']): MessageType => {
    switch (type) {
        case 'image':
            return 'IMAGE';
        case 'video':
            return 'VIDEO';
        case 'audio':
            return 'AUDIO';
        case 'file':
            return 'FILE';
    }
};

const sortHistory = (
    messages: readonly ChatMessage[]
): readonly ChatMessage[] => {
    return [...messages].sort(
        (left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt)
    );
};

const sortMedia = (
    messages: readonly ChatMessage[]
): readonly ChatMessage[] => {
    return [...messages].sort(
        (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)
    );
};

const mergeMessages = (
    current: readonly ChatMessage[] | undefined,
    incoming: readonly ChatMessage[]
): readonly ChatMessage[] => {
    return incoming.reduce<readonly ChatMessage[]>(
        (messages, message) => upsertChatMessage(messages, message),
        current ?? []
    );
};

const getRawMessageId = (message: RawChatMessage): string => {
    return message.id ?? message._id ?? '';
};

const mergeRawMessages = (
    cached: readonly RawChatMessage[],
    changed: readonly RawChatMessage[],
    direction: 'ASC' | 'DESC'
): readonly RawChatMessage[] => {
    const byId = new Map<string, RawChatMessage>();

    for (const message of [...cached, ...changed]) {
        const id = getRawMessageId(message);

        if (id) {
            byId.set(id, message);
        }
    }

    return [...byId.values()].sort((left, right) => {
        const difference = Date.parse(left.createdAt ?? '') - Date.parse(right.createdAt ?? '');
        return direction === 'ASC' ? difference : -difference;
    });
};

const normalizeMessages = (
    messages: readonly RawChatMessage[]
): readonly ChatMessage[] => {
    return messages.map(normalizeChatMessage);
};

export const useChatHistoryQuery = (active: boolean) => {
    const scope = useTenantQueryScope();
    const queryClient = useQueryClient();
    const connected = useChatStore((state) => state.connected);
    const queryKey = queryKeys.chatHistory(scope.tenantKey);

    return useQuery({
        queryKey,
        queryFn: async (): Promise<readonly ChatMessage[]> => {
            if (!scope.context) {
                return [];
            }

            const result = await syncCacheFirst<readonly RawChatMessage[]>({
                context: scope.context,
                resource: 'chat',
                path: '/chat/history',
                params: { limit: 50 },
                ttlMs: 30_000,
                incremental: {
                    merge: (cached, changed) => mergeRawMessages(cached, changed, 'ASC')
                },
                onData: (data) => {
                    queryClient.setQueryData(queryKey, sortHistory(normalizeMessages(data)));
                }
            });

            return sortHistory(normalizeMessages(result.data));
        },
        enabled: scope.enabled && active,
        staleTime: 5_000,
        refetchInterval: active && !connected ? 15_000 : false,
        refetchIntervalInBackground: false
    });
};

export const useChatMediaQuery = (active = true) => {
    const scope = useTenantQueryScope();
    const queryClient = useQueryClient();
    const queryKey = queryKeys.chatMedia(scope.tenantKey);

    return useQuery({
        queryKey,
        queryFn: async (): Promise<readonly ChatMessage[]> => {
            if (!scope.context) {
                return [];
            }

            const result = await syncCacheFirst<readonly RawChatMessage[]>({
                context: scope.context,
                resource: 'chat-media',
                path: '/chat/media',
                params: { limit: 200 },
                ttlMs: 2 * 60_000,
                incremental: {
                    merge: (cached, changed) => mergeRawMessages(cached, changed, 'DESC')
                },
                onData: (data) => {
                    queryClient.setQueryData(queryKey, sortMedia(normalizeMessages(data)));
                }
            });

            return sortMedia(normalizeMessages(result.data));
        },
        enabled: scope.enabled && active,
        staleTime: 30_000
    });
};

export const useChatDirectoryQuery = (enabledByModal: boolean) => {
    const scope = useTenantQueryScope();

    return useQuery({
        queryKey: queryKeys.chatDirectory(scope.tenantKey),
        queryFn: async ({ signal }) => {
            const response = await choirApi.get<ChatDirectoryResponse>(
                '/users/directory',
                {
                    timeout: 6_000,
                    signal
                }
            );
            return response.data.users;
        },
        enabled: scope.enabled && enabledByModal,
        staleTime: 5 * 60_000,
        retry: 0
    });
};

export const useSendChatMessageMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();

    return useMutation({
        mutationFn: async ({
            text,
            attachment,
            messageType,
            replyToId
        }: SendChatVariables): Promise<ChatMessage> => {
            let mediaAssetId: string | undefined;
            let resolvedMessageType: MessageType = messageType ?? 'TEXT';

            if (attachment) {
                const upload = await uploadChatMedia(attachment);
                mediaAssetId = upload.assetId;
                resolvedMessageType = mapAttachmentType(attachment.type);
            }

            const payload: NewMessagePayload = {
                content: text,
                type: resolvedMessageType,
                ...(mediaAssetId ? { mediaAssetId } : {}),
                ...(replyToId ? { replyTo: replyToId } : {})
            };

            return sendChatMessage(payload);
        },
        onSuccess: (created) => {
            queryClient.setQueryData<readonly ChatMessage[]>(
                queryKeys.chatHistory(scope.tenantKey),
                (current) => sortHistory(upsertChatMessage(current, created))
            );

            if (['IMAGE', 'FILE', 'MEDIA', 'AUDIO', 'VIDEO'].includes(created.type)) {
                queryClient.setQueryData<readonly ChatMessage[]>(
                    queryKeys.chatMedia(scope.tenantKey),
                    (current) => sortMedia(upsertChatMessage(current, created))
                );
            }

            useChatStore.getState().setReplyingTo(null);
        }
    });
};

export const useMarkChatReceiptsMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();

    return useMutation({
        mutationFn: ({ messageIds, status }: MarkChatReceiptsVariables) =>
            markChatReceipts(messageIds, status),
        onSuccess: (updatedMessages) => {
            queryClient.setQueryData<readonly ChatMessage[]>(
                queryKeys.chatHistory(scope.tenantKey),
                (current) => sortHistory(mergeMessages(current, updatedMessages))
            );
        }
    });
};
