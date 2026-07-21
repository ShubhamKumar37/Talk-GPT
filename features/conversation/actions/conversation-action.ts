"use server";

import { requireUser } from "@/features/auth/action/require-user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// we could also use "," or ";" both are correct to create the type
export type conversationListItem = {
    id: string;
    title: string;
    isPinned: boolean;
    isArchived: boolean;
    lastMessageAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export async function assertOwnConversations(conversationId: string, userId: string) {
    const conversationExist = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            userId: userId
        }
    });


    if (!conversationExist) throw new Error("No conversation found");

    return conversationExist;
}

export async function listConversations(): Promise<conversationListItem[]> {
    const user = await requireUser();

    const conversations = await prisma.conversation.findMany({
        where: { userId: user?.id, isArchived: false },
        orderBy: [{ isPinned: "desc" }, { lastMessageAt: "desc" }],
        select: {
            id: true,
            title: true,
            isPinned: true,
            isArchived: true,
            lastMessageAt: true,
            createdAt: true,
            updatedAt: true,
        }
    });

    return conversations;
}

export async function createConversation(title: string = "New Chat") {
    const user = await requireUser();
    if (!user) throw new Error("unauthorized");

    return await prisma.conversation.create({
        data: {
            userId: user.id,
            title: title.trim()

        }
    });
}

export async function updateConversation(conversationId: string, data: { title?: string, isPinned?: boolean, isArchived?: boolean }) {
    const user = await requireUser();
    if (!user) throw new Error("unauthorized");

    await assertOwnConversations(conversationId, user.id);

    const updatedConversation = await prisma.conversation.update({
        where: { id: conversationId, userId: user.id },
        data: {
            ...(data.title !== undefined ? { title: data.title.trim() || "New Chat" } : {}),
            ...(data.isPinned !== undefined ? { isPinned: data.isPinned } : {}),
            ...(data.isArchived !== undefined ? { isArchived: data.isArchived } : {})
        }
    });

    revalidatePath("/");
    revalidatePath(`/c/${conversationId}`);

    return updatedConversation;
}

export async function deleteConversation(conversationId: string) {
    const user = await requireUser();
    if (!user) throw new Error("unauthorized");

    await assertOwnConversations(conversationId, user.id);

    await prisma.conversation.delete({
        where: {
            id: conversationId,
        }
    });

    revalidatePath("/");

    return { id: conversationId };
}