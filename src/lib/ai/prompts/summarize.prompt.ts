import { Type } from "@google/genai";
import type { SummarizeThreadRequest } from "@/lib/schemas/aiSchema";

export const summarizeThreadJsonSchema = {
  type: Type.OBJECT,
  properties: {
    consensus: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "List of key decisions made, agreements, or completed milestones.",
    },
    blockers: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "List of active impediments, unanswered questions, or pending dependencies.",
    },
    actionItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          item: {
            type: Type.STRING,
            description: "Actionable next step.",
          },
          assigneeName: {
            type: Type.STRING,
            description: "Name of the person responsible, if mentioned, or null.",
          },
        },
        required: ["item"],
        propertyOrdering: ["item", "assigneeName"],
      },
      description: "Next steps assigned or implied from the discussion.",
    },
    markdownSummary: {
      type: Type.STRING,
      description: "A beautifully structured 2-3 paragraph markdown executive summary.",
    },
  },
  required: ["consensus", "blockers", "actionItems", "markdownSummary"],
  propertyOrdering: ["consensus", "blockers", "actionItems", "markdownSummary"],
};

export function buildSummarizePrompt(request: SummarizeThreadRequest): {
  systemInstruction: string;
  contents: string;
  responseJsonSchema: typeof summarizeThreadJsonSchema;
} {
  const systemInstruction = `You are an executive engineering manager and technical summarizer.
Your goal is to digest long, multi-party comment threads on a task into an actionable, structured briefing.

Structure your analysis into:
1. Consensus & Decisions: What was resolved, decided, or completed.
2. Active Blockers & Questions: What is currently blocking progress or awaiting answers.
3. Action Items: Clear, delegated next steps.
4. Markdown Summary: A concise, human-readable summary formatted in markdown for rapid scanning.
`;

  const formattedComments = request.comments
    .map((c) => `[${c.createdAt}] ${c.authorName}: ${c.content}`)
    .join("\n\n");

  const contents = `Task Title: ${request.taskTitle}
Task Description: ${request.taskDescription ?? "N/A"}

--- COMMENT THREAD (${request.comments.length} comments) ---
${formattedComments}
`;

  return {
    systemInstruction,
    contents,
    responseJsonSchema: summarizeThreadJsonSchema,
  };
}
