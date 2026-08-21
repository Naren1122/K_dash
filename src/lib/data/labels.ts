import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { Label } from "@/types/types";

export const getBoardLabels = cache(async (): Promise<Label[]> => {
  return prisma.label.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  });
});
