"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/types/prisma";
import {
  createLabelSchema,
  CreateLabelInput,
  labelIdSchema,
  updateLabelSchema,
  UpdateLabelInput,
} from "@/lib/schemas/labelSchema";
import { logger } from "@/lib/utils/logger";
import { ActionError, getCurrentUser, parseOrThrow, requireAdmin } from "@/lib/utils/action-utils";

const actionLogger = logger.action.bind(logger);

export async function getLabels() {
  const user = await getCurrentUser();

  const labels = await prisma.label.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  });

  actionLogger("get_labels", { userId: user.id, count: labels.length });
  return labels;
}

export async function createLabel(input: CreateLabelInput) {
  await requireAdmin();
  const { name, color } = parseOrThrow(createLabelSchema, input);

  actionLogger("create_label_start", { name, color });

  const existing = await prisma.label.findFirst({ where: { name } });
  if (existing) {
    actionLogger("create_label_duplicate", { name });
    throw new ActionError(400, "A label with this name already exists");
  }

  const label = await prisma.label.create({
    data: { name, color },
    select: { id: true, name: true, color: true },
  });

  actionLogger("create_label_success", { labelId: label.id });
  revalidatePath("/");
  return label;
}

export async function updateLabel(input: UpdateLabelInput) {
  await requireAdmin();
  const data = parseOrThrow(updateLabelSchema, input);
  const id = data.id;

  actionLogger("update_label_start", { labelId: id });

  const duplicate = await prisma.label.findFirst({
    where: { name: data.name, id: { not: id } },
  });
  if (duplicate) {
    actionLogger("update_label_duplicate", { name: data.name });
    throw new ActionError(400, "A label with this name already exists");
  }

  const label = await prisma.label.update({
    where: { id },
    data: { name: data.name, color: data.color },
    select: { id: true, name: true, color: true },
  });

  actionLogger("update_label_success", { labelId: label.id });
  revalidatePath("/");
  return label;
}

export async function deleteLabel(labelId: unknown) {
  await requireAdmin();
  const id = parseOrThrow(labelIdSchema, labelId);

  const labels = await prisma.label.deleteMany({
    where: { id },
  });

  if (labels.count === 0) {
    actionLogger("delete_label_not_found", { labelId: id });
    throw new ActionError(404, "Label not found");
  }

  actionLogger("delete_label_success", { labelId: id });
  revalidatePath("/");
}