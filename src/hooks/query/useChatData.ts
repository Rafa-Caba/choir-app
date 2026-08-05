// src/hooks/query/useChatData.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import choirApi from '../../api/choirApi';
import {
    getChatHistory,
    markChatReceipts,
    sendChatMessage,
    uploadChatMedia,
    type ChatAttachment
} from '../../services/chat';
import type {
    ChatMessage,
    ChatReceiptStatus,
    ChatUserSummary,
    MessageType,
    NewMessagePayload
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
}

interface MarkChatReceiptsVariables {
    readonly messageIds: readonly string[];
    readonly status: ChatReceiptStatus;
}

const mapAttachmentType = (type: ChatAttachment['type']): MessageType => {
    switch (type) {
        case 'image': return 'IMAGE';
        case 'video': return 'VIDEO';
        case 'audio': return 'AUDIO';
        case 'file': return 'FILE';
    }
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

export const useChatHistoryQuery = (active: boolean) => {
    const scope = useTenantQueryScope();
    const connected = useChatStore((state) => state.connected);

    return useQuery({
        queryKey: queryKeys.chatHistory(scope.tenantKey),
        queryFn: async ({ signal }) => (await getChatHistory(50, signal)).map(normalizeChatMessage),
        enabled: scope.enabled && active,
        staleTime: 5_000,
        refetchInterval: active && !connected ? 15_000 : false,
        refetchIntervalInBackground: false
    });
};

export const useChatDirectoryQuery = (enabledByModal: boolean) => {
    const scope = useTenantQueryScope();

    return useQuery({
        queryKey: queryKeys.chatDirectory(scope.tenantKey),
        queryFn: async ({ signal }) => {
            const response = await choirApi.get<ChatDirectoryResponse>('/users/directory', {
                timeout: 6_000,
                signal
            });
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
    const replyingTo = useChatStore((state) => state.replyingTo);

    return useMutation({
        mutationFn: async ({ text, attachment, messageType }: SendChatVariables): Promise<ChatMessage> => {
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
                ...(replyingTo ? { replyTo: replyingTo.id } : {})
            };

            return sendChatMessage(payload);
        },
        onSuccess: (created) => {
            queryClient.setQueryData<readonly ChatMessage[]>(
                queryKeys.chatHistory(scope.tenantKey),
                (current) => upsertChatMessage(current, created)
            );
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
                (current) => mergeMessages(current, updatedMessages)
            );
        }
    });
};
