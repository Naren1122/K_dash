import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";

import { Role } from "@/lib/types/prisma_type";
import { prisma } from "@/lib/utils/prisma";
import { logger } from "@/lib/utils/logger";

const authLogger = (...args: Parameters<typeof logger.auth>) => logger.auth(...args);

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
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

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error("[AUTH] authorize error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email?.toLowerCase();
        if (!email) return false;

        const dbUser = await prisma.user.findUnique({
          where: { email },
        });

        if (!dbUser) {
          authLogger("google_signin_denied_not_found", { email });
          return "/login?error=AccessDenied";
        }

        // Allow Admin or Member who has accepted their invitation
        if (dbUser.role === Role.ADMIN || dbUser.emailVerified !== null) {
          authLogger("google_signin_success", { email, role: dbUser.role });
          return true;
        }

        authLogger("google_signin_denied_pending_invite", { email });
        return "/login?error=InviteNotAccepted";
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // If signed in via Google, fetch current DB user details
      if (account?.provider === "google" && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            select: { id: true, role: true, name: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role as Role;
            token.name = dbUser.name ?? token.name;
          }
        } catch {
          // Keep token values if DB query is temporarily unavailable
        }
      } else if (user) {
        token.id = user.id ?? token.sub ?? "";
        token.role = user.role as Role;
        logger.debug("AUTH: jwt_created", { userId: user.id, role: user.role });
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || (token.sub as string);
        session.user.role = token.role as Role;

        if (session.user.email) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: session.user.email },
              select: { id: true, role: true },
            });
            if (dbUser) {
              session.user.id = dbUser.id;
              session.user.role = dbUser.role as Role;
            }
          } catch {
            // Keep fallback token values if DB query is temporarily unavailable
          }
        }

        logger.debug("AUTH: session_resolved", { userId: session.user.id, role: session.user.role });
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
