import { cache } from "react";
import { prisma } from "@/lib/utils/prisma";
import type { Label } from "@/lib/types/types";

export const getBoardLabelsFromDb = cache(async (): Promise<Label[]> => {
  return prisma.label.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  });
});

export async function findLabelsInDb() {
  return prisma.label.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  });
}

export async function findLabelByNameInDb(name: string, excludeId?: string) {
  return prisma.label.findFirst({
    where: {
      name,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
}

export async function findLabelByIdInDb(id: string) {
  return prisma.label.findUnique({
    where: { id },
  });
}

export async function createLabelInDb(data: { name: string; color: string }) {
  return prisma.label.create({
    data: { name: data.name, color: data.color },
    select: { id: true, name: true, color: true },
  });
}

export async function updateLabelInDb(id: string, data: { name?: string; color?: string }) {
  return prisma.label.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.color !== undefined ? { color: data.color } : {}),
    },
    select: { id: true, name: true, color: true },
  });
}

export async function deleteLabelInDb(id: string) {
  return prisma.label.deleteMany({
    where: { id },
  });
}
