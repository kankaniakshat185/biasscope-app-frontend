import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "sqlite"
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },
    emailVerification: {
        sendOnSignUp: true,
        sendVerificationEmail: async ({ user, url }) => {
            await resend.emails.send({
                from: "BiasScope <onboarding@resend.dev>",
                to: user.email,
                subject: "Verify your email address",
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 4px solid black; background-color: white;">
                        <h1 style="text-transform: uppercase; letter-spacing: -2px; font-weight: 900; font-size: 32px; margin-bottom: 10px;">Verify your identity</h1>
                        <p style="text-transform: uppercase; font-weight: 700; font-size: 14px; letter-spacing: 2px; color: #666; margin-bottom: 30px;">BiasScope Intelligence Protocol</p>
                        <div style="background-color: #FFF200; padding: 20px; border: 2px solid black; margin-bottom: 30px;">
                            <p style="font-weight: 700; font-size: 16px; margin: 0;">Click the button below to verify your email address and activate your account.</p>
                        </div>
                        <a href="${url}" style="display: inline-block; background-color: black; color: white; text-decoration: none; padding: 15px 30px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; border: 2px solid black;">Verify Account</a>
                        <p style="margin-top: 30px; font-size: 12px; color: #999;">If you didn't create an account, you can safely ignore this email.</p>
                    </div>
                `,
            });
        },
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        },
    },
    baseURL: process.env.BETTER_AUTH_URL || "https://biasscope-app.vercel.app",
    trustedOrigins: ["https://biasscope-app.vercel.app", "http://localhost:3000"],
    secret: process.env.BETTER_AUTH_SECRET || "default_super_secret_key"
});
