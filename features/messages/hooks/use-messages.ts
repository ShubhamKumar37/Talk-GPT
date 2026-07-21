"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createMessage, deleteMessage, listMessages, updateMessage } from "../actions/message-actions";
import { queryKeys } from "@/features/conversation/utils/query-keys";

export function useMessages(conversationId: string) {
    return useQuery({
        queryKey: queryKeys.messages.byConversation(conversationId ?? "none"),
        queryFn: () => listMessages(conversationId),
        enabled: Boolean(conversationId)
    });
}

export function useCreateMessage(conversationId: string, content: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => createMessage(conversationId, content),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.messages.byConversation(conversationId)
            });
            void queryClient.invalidateQueries({
                queryKey: queryKeys.conversations.all,
            });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Something went wrong while sending message");
        }
    });
}

export function useUpdateMessage(conversationId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, content }: { id: string, content: string }) => updateMessage(id, content),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.messages.byConversation(conversationId)
            });
            void queryClient.invalidateQueries({
                queryKey: queryKeys.conversations.all
            });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Some went wrong while updating message");
        }
    });
}

export function useDeleteMessage(conversationId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteMessage(id),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.messages.byConversation(conversationId)
            });
            void queryClient.invalidateQueries({
                queryKey: queryKeys.conversations.all
            });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Some went wrong while deleting message");
        }

    });
}