import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

import type { Role } from "@/types/prisma";
import { prisma } from "@/lib/prisma";
import { logger } from "@/utils/logger";

const authLogger = (...args: Parameters<typeof logger.auth>) => logger.auth(...args);

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
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
        try {
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

          // Ensure we are returning exactly what the JWT callback expects
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          // Log at error level so it's visible in production (Vercel logs)
          console.error("[AUTH] authorize error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // 1. On initial sign-in, `user` is available. Attach properties to the token.
      if (user) {
        token.id = user.id ?? token.sub ?? "";
        token.role = user.role as Role;
        authLogger("jwt_created", { userId: user.id, role: user.role });
      }

      // 2. Handle manual session updates if triggered elsewhere in the app
      if (trigger === "update" && session) {
        if (session.role) token.role = session.role;
        authLogger("jwt_updated", { userId: token.sub });
      }

      return token;
    },
    async session({ session, token }) {
      // 3. Transfer the token data to the session object for client-side use
      if (session.user) {
        session.user.id = (token.id as string) || (token.sub as string);
        session.user.role = token.role as Role;

        authLogger("session_created", { userId: session.user.id, role: session.user.role });
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