import { prisma } from "@/lib/utils/prisma";

export async function findBoardsInDb() {
  return prisma.board.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      columns: { orderBy: { position: "asc" } },
      _count: { select: { columns: true } },
    },
  });
}

export async function findBoardByIdInDb(boardId: string) {
  return prisma.board.findUnique({
    where: { id: boardId },
    include: {
      columns: { orderBy: { position: "asc" } },
      labels: { orderBy: { name: "asc" } },
    },
  });
}

export async function findBoardByKeyInDb(key: string) {
  return prisma.board.findUnique({
    where: { key },
  });
}

export async function createBoardInDb(data: { name: string; key: string }) {
  return prisma.board.create({
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
}

export async function updateBoardInDb(
  boardId: string,
  data: { name?: string; key?: string }
) {
  return prisma.board.update({
    where: { id: boardId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.key !== undefined ? { key: data.key } : {}),
    },
    include: { columns: { orderBy: { position: "asc" } } },
  });
}

export async function deleteBoardInDb(boardId: string) {
  return prisma.board.delete({
    where: { id: boardId },
  });
}
