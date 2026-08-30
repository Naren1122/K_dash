import { Type } from "@google/genai";
import type { DecomposeTaskRequest } from "@/lib/schemas/aiSchema";

export const decomposeTaskJsonSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Brief high-level overview of the breakdown approach (1-2 sentences).",
    },
    subtasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "Clear, actionable subtask title (e.g., 'Setup webhook signature validation').",
          },
          acceptanceCriteria: {
            type: Type.STRING,
            description: "Concrete definition of done / technical scope for this subtask.",
          },
          estimatedEffort: {
            type: Type.STRING,
            description: "Effort rating: QUICK_WIN, STANDARD, or COMPLEX.",
          },
        },
        required: ["title", "acceptanceCriteria", "estimatedEffort"],
        propertyOrdering: ["title", "acceptanceCriteria", "estimatedEffort"],
      },
      description: "List of 3 to 7 granular subtasks required to complete the main task.",
    },
  },
  required: ["summary", "subtasks"],
  propertyOrdering: ["summary", "subtasks"],
};

export function buildDecomposePrompt(request: DecomposeTaskRequest): {
  systemInstruction: string;
  contents: string;
  responseJsonSchema: typeof decomposeTaskJsonSchema;
} {
  const systemInstruction = `You are a Principal Software Architect and Agile Technical Lead.
Your job is to break down a high-level task/epic into 3 to 7 concrete, granular, and testable subtasks.

Rules:
1. Each subtask must be specific, bite-sized, and independently executable.
2. Provide crisp acceptance criteria / definition of done for each subtask.
3. Classify effort into:
   - "QUICK_WIN": < 30 minutes, minimal risk.
   - "STANDARD": 1-4 hours, normal engineering task.
   - "COMPLEX": Architectural, multiple moving parts, or needs deep testing.
4. Avoid generic filler tasks like "Do research" or "Review code" unless explicitly critical.
`;

  const contents = `Task Title: ${request.title}
Task Priority: ${request.priority ?? "MEDIUM"}
Task Description:
${request.description && request.description.trim().length > 0 ? request.description : "(No description provided)"}
`;

  return {
    systemInstruction,
    contents,
    responseJsonSchema: decomposeTaskJsonSchema,
  };
}
