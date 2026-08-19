"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/types/prisma";
import {
  createBoardSchema,
  CreateBoardInput,
  updateBoardSchema,
  UpdateBoardInput,
  boardIdSchema,
} from "@/lib/schemas/boardSchema";
import { logger } from "@/lib/utils/logger";
import {
  ActionError,
  getCurrentUser,
  parseOrThrow,
  requireAdmin,
} from "@/lib/utils/action-utils";

const actionLogger = logger.action.bind(logger);

export async function getBoards() {
  await getCurrentUser();
  return prisma.board.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      columns: { orderBy: { position: "asc" } },
      _count: { select: { columns: true } },
    },
  });
}

export async function getBoard(boardId: unknown) {
  await getCurrentUser();
  const id = parseOrThrow(boardIdSchema, boardId);

  const board = await prisma.board.findUnique({
    where: { id },
    include: {
      columns: { orderBy: { position: "asc" } },
      labels: { orderBy: { name: "asc" } },
    },
  });

  if (!board) {
    throw new ActionError(404, "Board not found");
  }

  return board;
}

export async function createBoard(input: CreateBoardInput) {
  await requireAdmin();
  const data = parseOrThrow(createBoardSchema, input);

  actionLogger("create_board_start", { name: data.name, key: data.key });

  const existing = await prisma.board.findUnique({ where: { key: data.key } });
  if (existing) {
    throw new ActionError(409, "A board with this key already exists");
  }

  const board = await prisma.board.create({
    data: {
      name: data.name,
      key: data.key,
      columns: {
        create: [
          { name: "To Do", status: "TODO", position: 0 },
          { name: "In Progress", status: "IN_PROGRESS", position: 1 },
          { name: "Done", status: "DONE", position: 2 },
        ],
      },
    },
    include: { columns: { orderBy: { position: "asc" } } },
  });

  actionLogger("create_board_success", { boardId: board.id, name: board.name });
  revalidatePath("/");
  return board;
}

export async function updateBoard(input: UpdateBoardInput) {
  await requireAdmin();
  const data = parseOrThrow(updateBoardSchema, input);

  actionLogger("update_board_start", { boardId: data.boardId, fields: Object.keys(input) });

  const board = await prisma.board.findUnique({ where: { id: data.boardId } });
  if (!board) {
    throw new ActionError(404, "Board not found");
  }

  if (data.key && data.key !== board.key) {
    const existing = await prisma.board.findUnique({ where: { key: data.key } });
    if (existing) {
      throw new ActionError(409, "A board with this key already exists");
    }
  }

  const updated = await prisma.board.update({
    where: { id: data.boardId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.key !== undefined && { key: data.key }),
    },
    include: { columns: { orderBy: { position: "asc" } } },
  });

  actionLogger("update_board_success", { boardId: updated.id });
  revalidatePath("/");
  return updated;
}

export async function deleteBoard(boardId: unknown) {
  await requireAdmin();
  const id = parseOrThrow(boardIdSchema, boardId);

  actionLogger("delete_board_start", { boardId: id });

  const board = await prisma.board.findUnique({ where: { id } });
  if (!board) {
    throw new ActionError(404, "Board not found");
  }

  await prisma.board.delete({ where: { id } });

  actionLogger("delete_board_success", { boardId: id, name: board.name });
  revalidatePath("/");
}
