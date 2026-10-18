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
  adminCookieName,
  COOKIE_BASE,
  isProduction,
} from "./session-config";

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

      const user = await prisma.user.findUnique({
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
      if (!user || !user.password) return null;

      if (!user.emailVerified && user.role !== "ADMIN") {
        throw new Error("EMAIL_NOT_VERIFIED");
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return null;

      // Fire-and-forget activity touch — never block login
      prisma.user
        .update({
          where: { id: user.id },
          data: { lastActiveAt: new Date() },
        })
        .catch(() => {});

      // Minimal user object — NO image blobs in token
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

/**
 * Cookie name depends on role after sign-in.
 * NextAuth uses one sessionToken name per config; we use customer as default
 * and middleware copies/clears admin cookie separately for /admin routes.
 */
const sessionCookieName = customerCookieName();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: SESSION.JWT_MAX_AGE_SEC,
    updateAge: 60, // refresh at most once per minute
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
      name: isProduction()
        ? "__Secure-hama.callback"
        : "hama.callback",
      options: {
        ...COOKIE_BASE,
        httpOnly: true,
        maxAge: 60 * 15,
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
    async jwt({ token, user, trigger }) {
      const now = Math.floor(Date.now() / 1000);

      if (user) {
        // Tiny JWT payload only
        token.sub = user.id;
        token.role = (user as { role?: Role }).role ?? "USER";
        token.name = user.name ?? undefined;
        token.email = user.email ?? undefined;
        token.la = now; // last activity (unix seconds)
        // Explicitly strip heavy fields
        delete token.picture;
        delete token.image;
        return token;
      }

      // Inactivity: expire token if idle too long
      const role = (token.role as Role) || "USER";
      const lastActive = typeof token.la === "number" ? token.la : now;
      const idleLimitSec =
        role === "ADMIN"
          ? SESSION.ADMIN_IDLE_MS / 1000
          : SESSION.CUSTOMER_IDLE_MS / 1000;

      if (now - lastActive > idleLimitSec) {
        // Force empty token → unauthenticated
        return { exp: 0 } as typeof token;
      }

      // Touch activity on session update / periodic refresh
      if (trigger === "update" || now - lastActive > 30) {
        token.la = now;
      }

      // Never keep image/picture in JWT
      delete token.picture;
      delete token.image;

      return token;
    },
    async session({ session, token }) {
      if (!token?.sub || token.exp === 0) {
        // Empty session
        session.user = {
          id: "",
          role: "USER",
          name: null,
          email: null,
          image: null,
        };
        return session;
      }

      session.user = {
        id: String(token.sub),
        role: (token.role as Role) || "USER",
        name: (token.name as string) || null,
        email: (token.email as string) || null,
        // Images never from cookie — client fetches /api/account
        image: token.role === "ADMIN" ? "/logo.png" : null,
      };
      return session;
    },
  },
  trustHost: true,
});

/** Exported for middleware admin cookie mirroring */
export { adminCookieName, customerCookieName };
