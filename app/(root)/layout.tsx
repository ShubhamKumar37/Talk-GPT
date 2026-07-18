"use server";

import { onBoard } from "@/features/auth/action/onboard";
import { auth } from "@clerk/nextjs/server";

export default async function Layout({children}: {children: React.ReactNode})
{
    await auth.protect();
    await onBoard();

    return <div>{children}</div>
}