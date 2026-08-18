import "server-only";

import { PrismaClient } from "../generated/prisma/client";
import { logger } from "@/lib/logger";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

const dbLogger = logger.db;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development"
      ? [
          { emit: "stdout", level: "query" },
          { emit: "stdout", level: "error" },
          { emit: "stdout", level: "warn" },
        ]
      : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
