import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "sqlite"
    }),
    emailAndPassword: {
        enabled: true,
    },
    baseURL: process.env.BETTER_AUTH_URL || "https://biasscope-app.vercel.app",
    trustedOrigins: ["https://biasscope-app.vercel.app", "http://localhost:3000"],
    secret: process.env.BETTER_AUTH_SECRET || "default_super_secret_key"
});
