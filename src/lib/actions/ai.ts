"use server";

import { getCurrentUser } from "@/lib/utils/action-utils";
import { logger } from "@/lib/utils/logger";
import { generateStructuredContent } from "@/lib/ai/gemini";
import {
  magicTaskRequestSchema,
  magicTaskResponseSchema,
  MagicTaskRequest,
  MagicTaskResponse,
  decomposeTaskRequestSchema,
  decomposeTaskResponseSchema,
  DecomposeTaskRequest,
  DecomposeTaskResponse,
  summarizeThreadRequestSchema,
  summarizeThreadResponseSchema,
  SummarizeThreadRequest,
  SummarizeThreadResponse,
} from "@/lib/schemas/aiSchema";
import { buildMagicTaskPrompt } from "@/lib/ai/prompts/magic-task.prompt";
import { buildDecomposePrompt } from "@/lib/ai/prompts/decompose.prompt";
import { buildSummarizePrompt } from "@/lib/ai/prompts/summarize.prompt";
import { safeServerAction } from "@/lib/error_actions/action-handler";
import type { ActionResult } from "@/lib/error_actions/action-types";

const actionLogger = (name: string, context?: Record<string, unknown>) => logger.action(name, context);

/**
 * Server action to parse natural language description into structured task fields.
 */
export async function generateTaskFromPromptAction(
  input: MagicTaskRequest
): Promise<ActionResult<MagicTaskResponse>> {
  return safeServerAction(
    {
      actionName: "ai_magic_task",
      schema: magicTaskRequestSchema,
      handler: async (validatedInput) => {
        const user = await getCurrentUser();

        actionLogger("ai_magic_task_start", {
          userId: user.id,
          promptLength: validatedInput.prompt.length,
        });

        const promptConfig = buildMagicTaskPrompt(validatedInput);

        const result = await generateStructuredContent(
          {
            contents: promptConfig.contents,
            systemInstruction: promptConfig.systemInstruction,
            responseJsonSchema: promptConfig.responseJsonSchema,
            temperature: 0.1,
          },
          (raw) => magicTaskResponseSchema.parse(raw)
        );

        actionLogger("ai_magic_task_success", {
          userId: user.id,
          taskTitle: result.title,
          hasAssignee: Boolean(result.assigneeId),
          hasDueDate: Boolean(result.dueDate),
          labelCount: result.labelIds.length,
        });

        return result;
      },
    },
    input
  );
}

/**
 * Server action to decompose a task/epic into granular subtasks.
 */
export async function decomposeTaskAction(
  input: DecomposeTaskRequest
): Promise<ActionResult<DecomposeTaskResponse>> {
  return safeServerAction(
    {
      actionName: "ai_decompose_task",
      schema: decomposeTaskRequestSchema,
      handler: async (validatedInput) => {
        const user = await getCurrentUser();

        actionLogger("ai_decompose_task_start", {
          userId: user.id,
          taskId: validatedInput.taskId,
          title: validatedInput.title,
        });

        const promptConfig = buildDecomposePrompt(validatedInput);

        const result = await generateStructuredContent(
          {
            contents: promptConfig.contents,
            systemInstruction: promptConfig.systemInstruction,
            responseJsonSchema: promptConfig.responseJsonSchema,
            temperature: 0.2,
          },
          (raw) => decomposeTaskResponseSchema.parse(raw)
        );

        actionLogger("ai_decompose_task_success", {
          userId: user.id,
          subtaskCount: result.subtasks.length,
        });

        return result;
      },
    },
    input
  );
}

/**
 * Server action to summarize a task's comment discussion thread.
 */
export async function summarizeThreadAction(
  input: SummarizeThreadRequest
): Promise<ActionResult<SummarizeThreadResponse>> {
  return safeServerAction(
    {
      actionName: "ai_summarize_thread",
      schema: summarizeThreadRequestSchema,
      handler: async (validatedInput) => {
        const user = await getCurrentUser();

        actionLogger("ai_summarize_thread_start", {
          userId: user.id,
          taskId: validatedInput.taskId,
          commentCount: validatedInput.comments.length,
        });

        const promptConfig = buildSummarizePrompt(validatedInput);

        const result = await generateStructuredContent(
          {
            contents: promptConfig.contents,
            systemInstruction: promptConfig.systemInstruction,
            responseJsonSchema: promptConfig.responseJsonSchema,
            temperature: 0.2,
          },
          (raw) => summarizeThreadResponseSchema.parse(raw)
        );

        actionLogger("ai_summarize_thread_success", {
          userId: user.id,
          taskId: validatedInput.taskId,
          consensusCount: result.consensus.length,
          blockersCount: result.blockers.length,
          actionItemsCount: result.actionItems.length,
        });

        return result;
      },
    },
    input
  );
}
