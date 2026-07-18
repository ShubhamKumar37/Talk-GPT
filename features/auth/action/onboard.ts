"use server";

import { currentUser } from "@clerk/nextjs/server";
// import { User } from "@/lib/generated/prisma/client"
import { prisma } from "@/lib/db";


export async function onBoard() {
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error("unauthorized");

    const email = clerkUser.emailAddresses[0].emailAddress;

    return prisma.user.upsert({
        where: { clerkId: clerkUser.id },
        create: {
            clerkId: clerkUser.id,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl,
            email: email
        },
        update: {
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl,
            email: email
        }
    });
}