"use server";

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";



export async function requireUser() {
    const { userId } = await auth();
    if(!userId) throw new Error("unauthorized");

    const user = await prisma.user.findUnique({
        where: {
            clerkId: userId,
        },
    });

    return user;
}