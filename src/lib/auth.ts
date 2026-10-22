import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { Role } from "@prisma/client";
import {
  SESSION,
  customerCookieName,
  COOKIE_BASE,
  isProduction,
} from "./session-config";
import {
  checkLoginAllowed,
  recordLoginFailure,
  clearLoginFailures,
} from "./login-rate-limit";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
  interface User {
    role: Role;
  }
}

const providers: Provider[] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const email = String(credentials.email).toLowerCase().trim();
      const password = String(credentials.password);
      const limitKey = email;

      const allowed = await checkLoginAllowed(limitKey);
      if (!allowed.ok) {
        throw new Error("LOGIN_LOCKED");
      }

      let user;
      try {
        user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            emailVerified: true,
          },
        });
      } catch (e) {
        console.error("[auth] DB error:", e);
        throw new Error("DB_UNAVAILABLE");
      }

      if (!user || !user.password) {
        await recordLoginFailure(limitKey);
        return null;
      }

      // Admins always allowed; customers need verified email
      if (!user.emailVerified && user.role !== "ADMIN") {
        await recordLoginFailure(limitKey);
        throw new Error("EMAIL_NOT_VERIFIED");
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        await recordLoginFailure(limitKey);
        return null;
      }

      await clearLoginFailures(limitKey);

      prisma.user
        .update({
          where: { id: user.id },
          data: { lastActiveAt: new Date() },
        })
        .catch(() => {});

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

const sessionCookieName = customerCookieName();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: SESSION.JWT_MAX_AGE_SEC,
    updateAge: 120,
  },
  jwt: {
    maxAge: SESSION.JWT_MAX_AGE_SEC,
  },
  pages: {
    signIn: "/login",
    error: "/error",
  },
  providers,
  cookies: {
    sessionToken: {
      name: sessionCookieName,
      options: {
        ...COOKIE_BASE,
        maxAge: SESSION.JWT_MAX_AGE_SEC,
      },
    },
    callbackUrl: {
      name: isProduction() ? "__Secure-hama.callback" : "hama.callback",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction(),
        maxAge: 60 * 10,
      },
    },
    csrfToken: {
      name: isProduction() ? "__Host-hama.csrf" : "hama.csrf",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction(),
        maxAge: SESSION.JWT_MAX_AGE_SEC,
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { id: true, role: true },
        });
        if (existing) {
          user.id = existing.id;
          (user as { role?: Role }).role = existing.role;
        } else {
          (user as { role?: Role }).role = "USER";
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      const now = Math.floor(Date.now() / 1000);
      const slim: Record<string, unknown> = {};

      if (user) {
        let role: Role = (user as { role?: Role }).role ?? "USER";
        let sub = user.id;

        if (account?.provider === "google" && user.email) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email.toLowerCase() },
              select: { id: true, role: true },
            });
            if (dbUser) {
              sub = dbUser.id;
              role = dbUser.role;
            }
          } catch {
            /* keep defaults */
          }
        }

        slim.sub = sub;
        slim.role = role;
        slim.la = now;
        return slim as typeof token;
      }

      if (!token.sub) {
        return { exp: 0 } as typeof token;
      }

      const role = (token.role as Role) || "USER";
      const lastActive = typeof token.la === "number" ? token.la : now;
      const idleLimitSec =
        role === "ADMIN"
          ? SESSION.ADMIN_IDLE_MS / 1000
          : SESSION.CUSTOMER_IDLE_MS / 1000;

      if (now - lastActive > idleLimitSec) {
        return { exp: 0 } as typeof token;
      }

      slim.sub = token.sub;
      slim.role = role;
      slim.la = now - lastActive > 60 ? now : lastActive;

      return slim as typeof token;
    },
    async session({ session, token }) {
      if (!token?.sub || token.exp === 0) {
        session.user = {
          id: "",
          role: "USER",
          name: null,
          email: null,
          image: null,
        };
        return session;
      }

      let name: string | null = null;
      let email: string | null = null;
      try {
        const u = await prisma.user.findUnique({
          where: { id: String(token.sub) },
          select: { name: true, email: true },
        });
        name = u?.name ?? null;
        email = u?.email ?? null;
      } catch {
        /* ignore */
      }

      session.user = {
        id: String(token.sub),
        role: (token.role as Role) || "USER",
        name,
        email,
        image: token.role === "ADMIN" ? "/logo.png" : null,
      };
      return session;
    },
  },
  trustHost: true,
});

export { customerCookieName };
