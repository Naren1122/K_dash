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
import { buildDocumentTaskPrompt } from "@/lib/ai/prompts/document-task.prompt";
import { processDocumentFile } from "@/lib/ai/document-parser";
import { requireAdmin } from "@/lib/utils/action-utils";

import { AppError, ErrorCode } from "@/lib/errors";
import {
  documentTaskResponseSchema,
  DocumentTaskResponse,
} from "@/lib/schemas/aiSchema";
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

/**
 * Server action for Admin to upload a document (PDF, Word, TXT) and extract structured task fields via Gemini API.
 */
export async function extractTaskFromDocumentAction(
  formData: FormData
): Promise<ActionResult<DocumentTaskResponse>> {
  return safeServerAction(
    {
      actionName: "ai_document_task",
      handler: async () => {
        // Enforce Admin role
        const admin = await requireAdmin();

        const file = formData.get("file");
        if (!file || !(file instanceof File)) {
          throw new AppError("Please select a document file to upload.", {
            statusCode: 400,
            code: ErrorCode.BAD_REQUEST,
          });
        }

        const assigneesRaw = formData.get("assignees");
        let assignees: Array<{ id: string; name: string | null; email: string }> = [];
        if (typeof assigneesRaw === "string" && assigneesRaw.trim()) {
          try {
            assignees = JSON.parse(assigneesRaw);
          } catch {
            assignees = [];
          }
        }

        const labelsRaw = formData.get("labels");
        let labels: Array<{ id: string; name: string }> = [];
        if (typeof labelsRaw === "string" && labelsRaw.trim()) {
          try {
            labels = JSON.parse(labelsRaw);
          } catch {
            labels = [];
          }
        }

        const currentDate = (formData.get("currentDate") as string) || new Date().toISOString();

        actionLogger("ai_document_task_start", {
          adminId: admin.id,
          fileName: file.name,
          fileSize: file.size,
        });

        // 1. Process Word document (mammoth), PDF (base64 inline), or text document
        const extracted = await processDocumentFile(file);

        // 2. Build Gemini prompt with relevance and date guardrails
        const promptConfig = buildDocumentTaskPrompt({
          documentText: extracted.text,
          pdfBase64: extracted.base64Data,
          fileName: extracted.fileName,
          assignees,
          labels,
          currentDate,
        });


        // 3. Generate structured content with Gemini
        const result = await generateStructuredContent(
          {
            contents: promptConfig.contents,
            systemInstruction: promptConfig.systemInstruction,
            responseJsonSchema: promptConfig.responseJsonSchema,
            temperature: 0.1,
          },
          (raw) => documentTaskResponseSchema.parse(raw)
        );

        // 4. Check actionability / relevance guardrail
        if (!result.isValidTaskDocument) {
          const reason =
            result.rejectionReason ||
            "The uploaded document does not contain actionable project task requirements (e.g. detected lyrics, poetry, random text, or unrelated material).";
          actionLogger("ai_document_task_rejected", {
            adminId: admin.id,
            fileName: file.name,
            reason,
          });
          throw new AppError(reason, {
            statusCode: 422,
            code: ErrorCode.BAD_REQUEST,
          });
        }

        // 5. Future date guardrail (server-side verification)
        if (result.dueDate) {
          const todayStr = new Date().toISOString().split("T")[0];
          if (result.dueDate < todayStr) {
            actionLogger("ai_document_task_past_date_stripped", {
              adminId: admin.id,
              pastDate: result.dueDate,
              todayStr,
            });
            result.dueDate = null;
          }
        }

        actionLogger("ai_document_task_success", {
          adminId: admin.id,
          fileName: file.name,
          taskTitle: result.title,
          priority: result.priority,
          hasDueDate: Boolean(result.dueDate),
        });

        return result;
      },
    },
    null
  );
}

