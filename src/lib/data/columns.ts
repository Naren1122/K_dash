import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { BoardColumn } from "@/types/column-types";

export const getBoardColumns = cache(async (): Promise<BoardColumn[]> => {
  return prisma.column.findMany({
    orderBy: { position: "asc" },
  });
});
