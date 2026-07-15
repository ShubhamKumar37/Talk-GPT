import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const globalPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
};

function createPrismaClient() {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("Database connection string not availabe");

    const adapter = new PrismaPg({ connectionString: url });
    return new PrismaClient({ adapter });
}

export const prisma = globalPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalPrisma.prisma = prisma;
}