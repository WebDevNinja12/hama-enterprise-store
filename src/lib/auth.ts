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
    };
  }
  interface User {
    role: Role;
  }
}

const ADMIN_LOGO = "/logo.png";

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

      const image =
        user.role === "ADMIN"
          ? user.image || ADMIN_LOGO
          : user.image;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image,
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
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: Role }).role ?? "USER";
        token.picture = user.image;
        token.name = user.name;
      }

      // Refresh profile from client update
      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = session.name;
        if (session.image !== undefined) token.picture = session.image;
      }

      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, image: true, name: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.name = dbUser.name;
            token.picture =
              dbUser.role === "ADMIN"
                ? dbUser.image || ADMIN_LOGO
                : dbUser.image;
          }
          await prisma.user.update({
            where: { id: token.id as string },
            data: { lastActiveAt: new Date() },
          });
        } catch {
          /* ignore */
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || "";
        session.user.role = (token.role as Role) || "USER";
        session.user.name = (token.name as string) || session.user.name;
        session.user.image =
          (token.picture as string) ||
          (token.role === "ADMIN" ? ADMIN_LOGO : null);
      }
      return session;
    },
  },
  trustHost: true,
});
