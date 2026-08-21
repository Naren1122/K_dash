"use server";

import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  columnIdSchema,
  createColumnSchema,
  CreateColumnInput,
  reorderColumnsSchema,
  ReorderColumnsInput,
  updateColumnSchema,
  UpdateColumnInput,
} from "@/lib/schemas/columnSchema";
import { logger } from "@/utils/logger";
import { ActionError, getCurrentUser, parseOrThrow, requireAdmin } from "@/utils/action-utils";

import { notifyAllAdmins } from "@/lib/data/notifications";

const actionLogger = logger.action.bind(logger);

export async function getColumns(boardId?: string) {
  await getCurrentUser();

  const where = boardId ? { boardId } : {};
  const columns = await prisma.column.findMany({
    where,
    orderBy: { position: "asc" },
  });

  return columns;
}

export async function createColumn(input: CreateColumnInput) {
  const user = await requireAdmin();
  const data = parseOrThrow(createColumnSchema, input);

  actionLogger("create_column_start", { name: data.name, boardId: data.boardId });

  // Get current highest position for this board
  const lastColumn = await prisma.column.findFirst({
    where: { boardId: data.boardId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const nextPosition = lastColumn ? lastColumn.position + 1 : 0;

  const column = await prisma.column.create({
    data: {
      name: data.name,
      status: data.status,
      wipLimit: data.wipLimit ?? null,
      position: nextPosition,
      boardId: data.boardId,
    },
  }).catch((e: unknown) => {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2002") {
      throw new ActionError(409, `A column with status "${data.status}" already exists on this board`);
    }
    throw e;
  });

  await notifyAllAdmins("TASK_STATUS_CHANGED", {
    actorId: user.id,
    actorName: (user.name || user.email || undefined) as string | undefined,
    message: `${user.name || user.email || "Admin"} created column "${column.name}"`,
  });

  actionLogger("create_column_success", { columnId: column.id });
  revalidatePath("/");
  return column;
}

export async function updateColumn(input: UpdateColumnInput) {
  const user = await requireAdmin();
  const data = parseOrThrow(updateColumnSchema, input);

  actionLogger("update_column_start", { columnId: data.columnId });

  const existing = await prisma.column.findUnique({ where: { id: data.columnId } });
  if (!existing) {
    throw new ActionError(404, "Column not found");
  }

  const updated = await prisma.column.update({
    where: { id: data.columnId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.wipLimit !== undefined && { wipLimit: data.wipLimit }),
    },
  });

  await notifyAllAdmins("TASK_STATUS_CHANGED", {
    actorId: user.id,
    actorName: (user.name || user.email || undefined) as string | undefined,
    message: `${user.name || user.email || "Admin"} updated column "${updated.name}"`,
  });

  actionLogger("update_column_success", { columnId: updated.id });
  revalidatePath("/");
  return updated;
}

export async function deleteColumn(columnId: unknown) {
  const user = await requireAdmin();
  const id = parseOrThrow(columnIdSchema, columnId);

  actionLogger("delete_column_start", { columnId: id });

  const column = await prisma.column.findUnique({ where: { id } });
  if (!column) {
    throw new ActionError(404, "Column not found");
  }

  await prisma.column.delete({ where: { id } });

  await notifyAllAdmins("TASK_STATUS_CHANGED", {
    actorId: user.id,
    actorName: (user.name || user.email || undefined) as string | undefined,
    message: `${user.name || user.email || "Admin"} deleted column "${column.name}"`,
  });

  actionLogger("delete_column_success", { columnId: id });
  revalidatePath("/");
}

export async function reorderColumns(input: ReorderColumnsInput) {
  await requireAdmin();
  const { boardId, columnIds } = parseOrThrow(reorderColumnsSchema, input);

  actionLogger("reorder_columns_start", { boardId, count: columnIds.length });

  // We use a two-step update in a single transaction to avoid unique constraint 
  // violations (boardId, position) when swapping positions.
  const updates = [
    // Step 1: Move all updated columns to temporary negative positions
    ...columnIds.map((id: string, index: number) =>
      prisma.column.update({
        where: { id },
        data: { position: -(index + 1) * 1000 },
      }),
    ),
    // Step 2: Assign the final correct positions
    ...columnIds.map((id: string, index: number) =>
      prisma.column.update({
        where: { id },
        data: { position: index },
      }),
    ),
  ];

  await prisma.$transaction(updates);

  actionLogger("reorder_columns_success", { boardId });
  revalidatePath("/");
}
