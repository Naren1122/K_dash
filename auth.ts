import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Role } from "./src/generated/prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const authLogger = (...args: Parameters<typeof logger.auth>) => logger.auth(...args);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        authLogger("authorize_attempt", { email });

        if (!email || !password) {
          authLogger("authorize_failed", { reason: "missing_credentials", email });
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          authLogger("authorize_failed", { reason: "user_not_found", email });
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
          authLogger("authorize_failed", { reason: "invalid_password", email });
          return null;
        }

        authLogger("authorize_success", { email, userId: user.id, role: user.role });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        authLogger("jwt_created", { userId: token.sub, role: user.role });
      }
      if (trigger === "update" && session) {
        authLogger("jwt_updated", { userId: token.sub });
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub && token.role) {
        session.user.id = token.sub;
        session.user.role = token.role as Role;
        authLogger("session_created", { userId: token.sub, role: token.role });
      }
      return session;
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      authLogger("signin", { userId: user.id, email: user.email, isNewUser });
    },
    async signOut(message) {
      const token = 'token' in message ? message.token : null;
      authLogger("signout", { userId: token?.sub });
    },
  },
});
