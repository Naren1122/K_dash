import { cache } from "react";
import { prisma } from "@/lib/utils/prisma";
import type { TaskStatus } from "@/lib/types/prisma_type";
import type { BoardColumn } from "@/lib/types/column-types";

export const getBoardColumnsFromDb = cache(async (): Promise<BoardColumn[]> => {
  return prisma.column.findMany({
    orderBy: { position: "asc" },
  });
});

export async function findColumnsInDb(boardId?: string) {
  const where = boardId ? { boardId } : {};
  return prisma.column.findMany({
    where,
    orderBy: { position: "asc" },
  });
}

export async function findColumnByIdInDb(columnId: string) {
  return prisma.column.findUnique({
    where: { id: columnId },
  });
}

export async function findHighestColumnPositionInDb(boardId: string): Promise<number> {
  const lastColumn = await prisma.column.findFirst({
    where: { boardId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  return lastColumn ? lastColumn.position + 1 : 0;
}

export async function createColumnInDb(data: {
  name: string;
  status: TaskStatus;
  wipLimit?: number | null;
  position: number;
  boardId: string;
}) {
  return prisma.column.create({
    data: {
      name: data.name,
      status: data.status,
      wipLimit: data.wipLimit ?? null,
      position: data.position,
      boardId: data.boardId,
    },
  });
}

export async function updateColumnInDb(
  columnId: string,
  data: {
    name?: string;
    wipLimit?: number | null;
  }
) {
  return prisma.column.update({
    where: { id: columnId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.wipLimit !== undefined ? { wipLimit: data.wipLimit } : {}),
    },
  });
}

export async function deleteColumnInDb(columnId: string) {
  return prisma.column.delete({
    where: { id: columnId },
  });
}

export async function reorderColumnsInDb(columnIds: string[]) {
  const updates = [
    // Step 1: Move all updated columns to temporary negative positions
    ...columnIds.map((id: string, index: number) =>
      prisma.column.update({
        where: { id },
        data: { position: -(index + 1) * 1000 },
      })
    ),
    // Step 2: Assign the final correct positions
    ...columnIds.map((id: string, index: number) =>
      prisma.column.update({
        where: { id },
        data: { position: index },
      })
    ),
  ];

  return prisma.$transaction(updates);
}
