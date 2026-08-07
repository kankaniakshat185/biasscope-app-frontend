import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

// Standard Next.js hot-reload guard: without this, every dev-server module
// reload constructs a brand-new PrismaClient (and connection pool) instead
// of reusing one, which is the usual cause of "too many connections"
// errors in local development.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const resend = new Resend(process.env.RESEND_API_KEY);

// Fail loudly at boot if the signing secret is missing, rather than
// silently signing every session with a hardcoded value that's sitting in
// plaintext in this public repo.
const authSecret = process.env.BETTER_AUTH_SECRET;
if (!authSecret) {
    throw new Error(
        "BETTER_AUTH_SECRET is not set. Refusing to start with a fallback secret " +
        "— set it in the environment before booting the app."
    );
}

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
    secret: authSecret,
    // The FastAPI backend lives on a different registrable domain
    // (HuggingFace Spaces) than this app (Vercel), so the session cookie
    // needs SameSite=None + Secure to be sent on cross-site fetches at all.
    // Locally, frontend/backend are same-site (both "localhost", different
    // ports) so the default Lax/insecure cookie already works — only
    // tighten this in production.
    //
    // NOTE: verify `advanced.defaultCookieAttributes` is still the correct
    // config key for your installed better-auth version — check the
    // Set-Cookie header in your browser's network tab after a login in
    // production and confirm it actually carries SameSite=None; Secure.
    advanced: {
        defaultCookieAttributes:
            process.env.NODE_ENV === "production"
                ? { sameSite: "none", secure: true }
                : {},
    },
});
