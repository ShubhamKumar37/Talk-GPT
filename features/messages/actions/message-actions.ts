import { requireUser } from "@/features/auth/action/require-user";
import { assertOwnConversations } from "@/features/conversation/actions/conversation-action";
import { prisma } from "@/lib/db";
import { MessageRole, MessageStatus } from "@/lib/generated/prisma/enums";
import { revalidatePath } from "next/cache";


export type MessageItem = {
    id: string;
    conversationId: string;
    role: MessageRole;
    status: MessageStatus;
    content: string;
    createdAt: Date;
    updatedAt: Date;
};

export async function listMessages(conversationId: string): Promise<MessageItem[]> {
    const user = await requireUser();
    if (!user) throw new Error("unauthorized");

    await assertOwnConversations(conversationId, user.id);

    return await prisma.message.findMany({
        where: {
            conversationId: conversationId,
        },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            conversationId: true,
            role: true,
            status: true,
            content: true,
            createdAt: true,
            updatedAt: true,
        }
    });
}

export async function createMessage(conversationId: string, content: string) {
    const user = await requireUser() || { id: "123" };
    const conversation = await assertOwnConversations(conversationId, user.id);
    const trimmed = content.trim();

    if (!trimmed) throw new Error("Message cann't be empty");

    const newMessage = await prisma.message.create({
        data: {
            conversationId: conversationId,
            content: trimmed,
            role: MessageRole.USER,
            status: MessageStatus.COMPLTETE
        }
    });

    const isRename = conversation.title === "New Chat" || conversation.title.trim() === "";
    if (isRename) {
        await prisma.conversation.update({
            where: {
                id: conversationId,
                userId: user.id
            },
            data: {
                lastMessageAt: new Date(),
                ...(isRename ? {
                    title: (trimmed.length > 40 ? `${trimmed.slice(0, 40)}` : trimmed)
                } : {})
            }
        });
    }

    revalidatePath("/");
    revalidatePath(`/c/${conversationId}`);

    return newMessage;
}

export async function updateMessage(messageId: string, content: string) {
    const user = await requireUser();
    if (!user) throw new Error("unauthorized");

    const trimmed = content.trim();
    if (!trimmed) throw new Error("Empty message can't be updated");

    const messageExist = await prisma.message.findFirst({
        where: {
            id: messageId
        },
        include: {
            conversation: true
        }
    });

    if (!messageExist || messageExist.conversation.id !== user.id) throw new Error("Message can't be updated");

    const updatedMessage = await prisma.message.update({
        where: {
            id: messageExist.id
        },
        data: {
            content: trimmed
        }
    });

    revalidatePath(`/c/${messageExist.conversationId}`);
    return updatedMessage;
}

export async function deleteMessage(messageId: string) {
    const user = await requireUser();
    if (!user) throw new Error("unauthorized");

    const existing = await prisma.message.findUnique({
        where: { id: messageId },
        include: { conversation: true },
    });

    if (!existing || existing.conversation.userId !== user.id) {
        throw new Error("Message not found");
    }

    await prisma.message.delete({ where: { id: messageId } });

    revalidatePath(`/c/${existing.conversationId}`);
    return { id: messageId, conversationId: existing.conversationId };
}