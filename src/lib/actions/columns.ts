"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/lib/types/prisma_type";
import {
  columnIdSchema,
  createColumnSchema,
  CreateColumnInput,
  reorderColumnsSchema,
  ReorderColumnsInput,
  updateColumnSchema,
  UpdateColumnInput,
} from "@/lib/schemas/columnSchema";
import { logger } from "@/lib/utils/logger";
import { ActionError, getCurrentUser, parseOrThrow, requireAdmin } from "@/lib/utils/action-utils";
import type { BoardColumn } from "@/lib/types/column-types";
import { notifyAllAdmins } from "@/lib/actions/notifications";
import {
  getBoardColumnsFromDb,
  findColumnsInDb,
  findColumnByIdInDb,
  findHighestColumnPositionInDb,
  createColumnInDb,
  updateColumnInDb,
  deleteColumnInDb,
  reorderColumnsInDb,
} from "@/lib/data/column.data";

const actionLogger = (name: string, context?: Record<string, unknown>) => logger.action(name, context);

export async function getBoardColumns(): Promise<BoardColumn[]> {
  return getBoardColumnsFromDb();
}

export async function getColumns(boardId?: string) {
  await getCurrentUser();
  return findColumnsInDb(boardId);
}

export async function createColumn(input: CreateColumnInput) {
  const user = await requireAdmin();
  const data = parseOrThrow(createColumnSchema, input);

  actionLogger("create_column_start", { name: data.name, boardId: data.boardId });

  const nextPosition = await findHighestColumnPositionInDb(data.boardId);

  try {
    const column = await createColumnInDb({
      name: data.name,
      status: data.status,
      wipLimit: data.wipLimit,
      position: nextPosition,
      boardId: data.boardId,
    });

    await notifyAllAdmins("TASK_STATUS_CHANGED", {
      actorId: user.id,
      actorName: (user.name || user.email || undefined) as string | undefined,
      message: `${user.name || user.email || "Admin"} created column "${column.name}"`,
    });

    actionLogger("create_column_success", { columnId: column.id });
    revalidatePath("/");
    return column;
  } catch (e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new ActionError(409, `A column with status "${data.status}" already exists on this board`);
    }
    throw e;
  }
}

export async function updateColumn(input: UpdateColumnInput) {
  const user = await requireAdmin();
  const data = parseOrThrow(updateColumnSchema, input);

  actionLogger("update_column_start", { columnId: data.columnId });

  const existing = await findColumnByIdInDb(data.columnId);
  if (!existing) {
    throw new ActionError(404, "Column not found");
  }

  const updated = await updateColumnInDb(data.columnId, {
    name: data.name,
    wipLimit: data.wipLimit,
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

  const column = await findColumnByIdInDb(id);
  if (!column) {
    throw new ActionError(404, "Column not found");
  }

  await deleteColumnInDb(id);

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

  await reorderColumnsInDb(columnIds);

  actionLogger("reorder_columns_success", { boardId });
  revalidatePath("/");
}
