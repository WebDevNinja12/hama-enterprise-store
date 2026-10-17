import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      hasCustomImage?: boolean;
    };
  }
  interface User {
    role: Role;
  }
}

const ADMIN_LOGO =
  "https://raw.githubusercontent.com/WebDevNinja12/hama-enterprise-store/main/logo.png";

/**
 * Never put large data: URLs into the JWT cookie — that causes
 * 494 REQUEST_HEADER_TOO_LARGE on Vercel/Cloudflare.
 * Only allow short http(s) URLs or known relative paths.
 */
function safeSessionImage(
  image: string | null | undefined,
  role?: Role | string
): string | null {
  if (!image) {
    return role === "ADMIN" ? ADMIN_LOGO : null;
  }
  if (image.startsWith("data:")) {
    // Stored in DB only — load via /api/account, not cookie
    return role === "ADMIN" ? ADMIN_LOGO : null;
  }
  if (image.length > 500) {
    return role === "ADMIN" ? ADMIN_LOGO : null;
  }
  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("/")
  ) {
    return image;
  }
  return role === "ADMIN" ? ADMIN_LOGO : null;
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

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.password) return null;

      if (!user.emailVerified && user.role !== "ADMIN") {
        throw new Error("EMAIL_NOT_VERIFIED");
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return null;

      await prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: safeSessionImage(user.image, user.role),
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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: Role }).role ?? "USER";
        token.name = user.name;
        token.picture = safeSessionImage(
          user.image,
          (user as { role?: Role }).role
        );
        token.hasCustomImage = Boolean(
          user.image && String(user.image).startsWith("data:")
        );
      }

      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = session.name;
        // Never accept a data URL into the token from client update
        if (session.image !== undefined) {
          token.picture = safeSessionImage(
            session.image,
            token.role as Role
          );
        }
        if (session.hasCustomImage !== undefined) {
          token.hasCustomImage = session.hasCustomImage;
        }
      }

      // Keep JWT small: only id, role, name, short image URL — no data URLs
      if (token.id && (user || trigger === "update")) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, image: true, name: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.name = dbUser.name;
            token.picture = safeSessionImage(dbUser.image, dbUser.role);
            token.hasCustomImage = Boolean(
              dbUser.image && dbUser.image.startsWith("data:")
            );
          }
        } catch {
          /* ignore */
        }
      }

      // Drop any accidental oversized picture field
      if (
        typeof token.picture === "string" &&
        (token.picture.startsWith("data:") || token.picture.length > 500)
      ) {
        token.picture =
          token.role === "ADMIN" ? ADMIN_LOGO : null;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || "";
        session.user.role = (token.role as Role) || "USER";
        session.user.name = (token.name as string) || session.user.name;
        session.user.image = safeSessionImage(
          token.picture as string | null,
          token.role as Role
        );
        session.user.hasCustomImage = Boolean(token.hasCustomImage);
      }
      return session;
    },
  },
  trustHost: true,
});
