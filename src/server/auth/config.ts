import "server-only";
import NextAuth, { type NextAuthConfig } from "next-auth";
import type { Provider } from "next-auth/providers";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/server/db/prisma";
import { logEvent } from "@/server/log";

const isDev = process.env.NODE_ENV !== "production";

export const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
const resendKey = process.env.AUTH_RESEND_KEY;

const providers: Provider[] = [];

if (googleEnabled) {
  providers.push(Google({ allowDangerousEmailAccountLinking: false }));
}

// Email magic link. Without a Resend key in development, the link is printed to the server console.
if (resendKey || isDev) {
  providers.push(
    Resend({
      apiKey: resendKey ?? "dev-console",
      from: process.env.EMAIL_FROM ?? "Vivah Studio <onboarding@resend.dev>",
      maxAge: 10 * 60, // 10 minutes (docs/13-security.md §1)
      ...(resendKey
        ? {}
        : {
            async sendVerificationRequest({ identifier, url }) {
              console.info(`\n[auth] Magic sign-in link for ${identifier}:\n${url}\n`);
            },
          }),
    }),
  );
}

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
  providers,
  pages: {
    signIn: "/login",
    verifyRequest: "/login/check-email",
    error: "/login",
  },
  trustHost: true,
  events: {
    signIn({ user, account }) {
      logEvent("auth.sign_in", { userId: user.id, provider: account?.provider });
    },
  },
  callbacks: {
    async signIn({ user }) {
      // Soft-deleted accounts cannot sign in again.
      if (user && "deletedAt" in user && user.deletedAt) return false;
      return true;
    },
    async session({ session, user }) {
      session.user.id = user.id;
      session.user.role = user.role ?? "USER";
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
