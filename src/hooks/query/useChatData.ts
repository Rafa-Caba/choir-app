// src/hooks/query/useChatData.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import choirApi from '../../api/choirApi';
import {
    getChatHistory,
    sendChatMessage,
    uploadChatMedia,
    type ChatAttachment
} from '../../services/chat';
import type {
    ChatMessage,
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
}

const mapAttachmentType = (type: ChatAttachment['type']): MessageType => {
    switch (type) {
        case 'image': return 'IMAGE';
        case 'video': return 'VIDEO';
        case 'audio': return 'AUDIO';
        case 'file': return 'FILE';
    }
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
        mutationFn: async ({ text, attachment }: SendChatVariables): Promise<ChatMessage> => {
            let mediaAssetId: string | undefined;
            let messageType: MessageType = 'TEXT';

            if (attachment) {
                const upload = await uploadChatMedia(attachment);
                mediaAssetId = upload.assetId;
                messageType = mapAttachmentType(attachment.type);
            }

            const payload: NewMessagePayload = {
                content: text,
                type: messageType,
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
