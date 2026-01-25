import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";


const globalForPrisma = global as unknown as { prisma: PrismaClient };

const config = {
    url: process.env.DATABASE_URL || "file:./dev.db",
};

const adapter = new PrismaLibSQL(config);

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
