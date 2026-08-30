import "server-only";

import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function getPrismaClient(): PrismaClient {
  if (
    globalForPrisma.prisma &&
    !("chatMessage" in globalForPrisma.prisma)
  ) {
    globalForPrisma.prisma = undefined;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log:
        process.env.PRISMA_LOG_QUERIES === "true"
          ? [
              { emit: "stdout", level: "query" },
              { emit: "stdout", level: "error" },
              { emit: "stdout", level: "warn" },
            ]
          : [
              { emit: "stdout", level: "error" },
              { emit: "stdout", level: "warn" },
            ],
    });
  }

  return globalForPrisma.prisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
