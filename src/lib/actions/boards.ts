"use server";

import { revalidatePath } from "next/cache";
import {
  createBoardSchema,
  CreateBoardInput,
  updateBoardSchema,
  UpdateBoardInput,
  boardIdSchema,
} from "@/lib/schemas/boardsSchema";
import { logger } from "@/lib/utils/logger";
import {
  ActionError,
  getCurrentUser,
  parseOrThrow,
  requireAdmin,
} from "@/lib/utils/action-utils";
import {
  findBoardsInDb,
  findBoardByIdInDb,
  findBoardByKeyInDb,
  createBoardInDb,
  updateBoardInDb,
  deleteBoardInDb,
} from "@/lib/data/board.data";

const actionLogger = (name: string, context?: Record<string, unknown>) => logger.action(name, context);

export async function getBoards() {
  await getCurrentUser();
  return findBoardsInDb();
}

export async function getBoard(boardId: unknown) {
  await getCurrentUser();
  const id = parseOrThrow(boardIdSchema, boardId);

  const board = await findBoardByIdInDb(id);
  if (!board) {
    throw new ActionError(404, "Board not found");
  }

  return board;
}

export async function createBoard(input: CreateBoardInput) {
  await requireAdmin();
  const data = parseOrThrow(createBoardSchema, input);

  actionLogger("create_board_start", { name: data.name, key: data.key });

  const existing = await findBoardByKeyInDb(data.key);
  if (existing) {
    throw new ActionError(409, "A board with this key already exists");
  }

  const board = await createBoardInDb({
    name: data.name,
    key: data.key,
  });

  actionLogger("create_board_success", { boardId: board.id, name: board.name });
  revalidatePath("/");
  return board;
}

export async function updateBoard(input: UpdateBoardInput) {
  await requireAdmin();
  const data = parseOrThrow(updateBoardSchema, input);

  actionLogger("update_board_start", { boardId: data.boardId, fields: Object.keys(input) });

  const board = await findBoardByIdInDb(data.boardId);
  if (!board) {
    throw new ActionError(404, "Board not found");
  }

  if (data.key && data.key !== board.key) {
    const existing = await findBoardByKeyInDb(data.key);
    if (existing) {
      throw new ActionError(409, "A board with this key already exists");
    }
  }

  const updated = await updateBoardInDb(data.boardId, {
    name: data.name,
    key: data.key,
  });

  actionLogger("update_board_success", { boardId: updated.id });
  revalidatePath("/");
  return updated;
}

export async function deleteBoard(boardId: unknown) {
  await requireAdmin();
  const id = parseOrThrow(boardIdSchema, boardId);

  actionLogger("delete_board_start", { boardId: id });

  const board = await findBoardByIdInDb(id);
  if (!board) {
    throw new ActionError(404, "Board not found");
  }

  await deleteBoardInDb(id);

  actionLogger("delete_board_success", { boardId: id, name: board.name });
  revalidatePath("/");
}
