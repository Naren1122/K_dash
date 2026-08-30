import { Type } from "@google/genai";
import type { MagicTaskRequest } from "@/lib/schemas/aiSchema";

export const magicTaskJsonSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "Concise, actionable task title (max 200 chars).",
    },
    description: {
      type: Type.STRING,
      description: "Clean markdown summary describing the requirements, context, and expectations.",
    },
    assigneeId: {
      type: Type.STRING,
      description: "The matched User ID from the available assignees list, or null if no clear match.",
    },
    priority: {
      type: Type.STRING,
      description: "Priority enum: LOW, MEDIUM, HIGH, or CRITICAL.",
    },
    dueDate: {
      type: Type.STRING,
      description: "Due date resolved to YYYY-MM-DD format (must not be in the past), or null.",
    },
    labelIds: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "Array of matched Label IDs from available labels.",
    },
  },
  required: ["title", "priority", "labelIds"],
  propertyOrdering: ["title", "description", "assigneeId", "priority", "dueDate", "labelIds"],
};

export function buildMagicTaskPrompt(request: MagicTaskRequest): {
  systemInstruction: string;
  contents: string;
  responseJsonSchema: typeof magicTaskJsonSchema;
} {
  const now = request.currentDate ? new Date(request.currentDate) : new Date();
  const dateAnchor = now.toISOString().split("T")[0];
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });

  const assigneesList =
    request.assignees && request.assignees.length > 0
      ? request.assignees
          .map((a) => `- ID: "${a.id}", Name: "${a.name ?? "Unnamed"}", Email: "${a.email}"`)
          .join("\n")
      : "None provided";

  const labelsList =
    request.labels && request.labels.length > 0
      ? request.labels.map((l) => `- ID: "${l.id}", Name: "${l.name}"`).join("\n")
      : "None provided";

  const systemInstruction = `You are an expert AI Kanban assistant for a project management board.
Your job is to parse a natural language task description and extract structured fields for a task creation form.

Rules:
1. Relative Dates: Today is ${dayName}, ${dateAnchor}. Resolve relative terms like "today", "tomorrow", "next Monday", "by Friday" into an exact YYYY-MM-DD date. Never return a date in the past. If no date is mentioned, set dueDate to null.
2. Assignee Matching: Match names or email mentions against the Available Assignees list below. Return the exact assignee ID. If ambiguous or not mentioned, set assigneeId to null.
3. Label Matching: Match keywords or explicit tag mentions against the Available Labels list. Return the array of matched label IDs.
4. Priority: Extract priority as "LOW", "MEDIUM", "HIGH", or "CRITICAL". Default to "MEDIUM" if unspecified. If words like "urgent", "asap", "critical", "blocker" appear, choose "CRITICAL" or "HIGH". If "low priority" or "minor", choose "LOW".
5. Title & Description: The title must be concise, crisp, and actionable. Move extra details, notes, links, or criteria into the description in clean markdown.

Available Assignees:
${assigneesList}

Available Labels:
${labelsList}
`;

  return {
    systemInstruction,
    contents: request.prompt,
    responseJsonSchema: magicTaskJsonSchema,
  };
}
