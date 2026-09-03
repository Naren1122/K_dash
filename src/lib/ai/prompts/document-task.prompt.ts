import { Type } from "@google/genai";

export const documentTaskJsonSchema = {
  type: Type.OBJECT,
  properties: {
    isValidTaskDocument: {
      type: Type.BOOLEAN,
      description: "True if the document contains actionable project work, feature requests, specifications, bug reports, or meeting action items. False if it contains songs, lyrics, poems, recipes, random characters/words, stories, or unrelated non-task text.",
    },
    rejectionReason: {
      type: Type.STRING,
      description: "If isValidTaskDocument is false, a concise, polite explanation explaining why the document was rejected (e.g. 'The uploaded file appears to be song lyrics or poetry and does not contain actionable project tasks.'). Null if valid.",
    },
    title: {
      type: Type.STRING,
      description: "Concise, actionable task title summarizing the primary objective (max 200 chars). Leave empty or null if isValidTaskDocument is false.",
    },
    description: {
      type: Type.STRING,
      description: "Clean, structured Markdown summary of the document's requirements, scope, key deliverables, or acceptance criteria. Leave empty or null if isValidTaskDocument is false.",
    },
    assigneeId: {
      type: Type.STRING,
      description: "The matched User ID from the available assignees list based on names/roles mentioned in the document, or null if no match.",
    },
    priority: {
      type: Type.STRING,
      description: "Priority enum: LOW, MEDIUM, HIGH, or CRITICAL. Default to MEDIUM if unspecified.",
    },
    dueDate: {
      type: Type.STRING,
      description: "Resolved future due date in YYYY-MM-DD format. MUST be on or after today's reference date. If only a past date is found or no date is specified, set to null.",
    },
    labelIds: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "Array of matched Label IDs from the available labels list.",
    },
  },
  required: ["isValidTaskDocument"],
  propertyOrdering: [
    "isValidTaskDocument",
    "rejectionReason",
    "title",
    "description",
    "assigneeId",
    "priority",
    "dueDate",
    "labelIds",
  ],
};

export type DocumentPromptInput = {
  documentText?: string;
  pdfBase64?: string;
  fileName?: string;
  assignees?: Array<{ id: string; name: string | null; email: string }>;
  labels?: Array<{ id: string; name: string }>;
  currentDate?: string;
};

export function buildDocumentTaskPrompt(request: DocumentPromptInput): {
  systemInstruction: string;
  contents: string | Array<string | { inlineData: { data: string; mimeType: string } }>;
  responseJsonSchema: typeof documentTaskJsonSchema;
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

  const systemInstruction = `You are an expert AI Kanban project assistant.
Your task is to analyze the content of an uploaded document (such as a specification, PDF brief, Word doc, or project notes) and convert it into a structured Kanban task.

CRITICAL RULES:

1. RELEVANCE & ACTIONABILITY FILTER:
   - Carefully assess whether the document contains real project work, feature requests, specifications, bug reports, user stories, or actionable tasks.
   - If the text is random letters/words, song lyrics, poetry, fictional stories, recipes, casual greetings, or unrelated noise:
     * Set "isValidTaskDocument" to false.
     * Provide a clear "rejectionReason" explaining what was detected and why it is not an actionable project task.
     * Set title, description, assigneeId, dueDate to null or empty.

2. STRICT FUTURE DUE DATE ENFORCEMENT:
   - Today's reference date is: ${dayName}, ${dateAnchor}.
   - Resolve any mentioned deadlines or relative dates (e.g., "by next Friday", "end of next month", "deadline Oct 15").
   - NEVER return a date that is before ${dateAnchor}.
   - If a date mentioned in the document is in the past, or if no valid future deadline is specified, set "dueDate" to null.

3. TITLE & DESCRIPTION:
   - Title: Crisp, professional, and action-oriented (e.g. "Implement user authentication with OAuth").
   - Description: Format as structured Markdown including Key Objectives, Requirements/Deliverables, and any Acceptance Criteria found in the document.

4. ASSIGNEE MATCHING:
   - Match names or emails mentioned in the document against the Available Assignees list below.
   - Return the exact matched ID or null.

5. LABEL MATCHING:
   - Match keywords, topics, or explicit tags in the document against the Available Labels list below.
   - Return an array of matched Label IDs.

6. PRIORITY DETECTION:
   - Return "CRITICAL", "HIGH", "MEDIUM", or "LOW".
   - If terms like "urgent", "P0", "blocker", "critical", or "asap" are emphasized, select "CRITICAL" or "HIGH".
   - Default to "MEDIUM".

Available Assignees:
${assigneesList}

Available Labels:
${labelsList}
`;

  const documentHeader = request.fileName
    ? `Document File Name: ${request.fileName}\n\n`
    : "";

  if (request.pdfBase64) {
    return {
      systemInstruction,
      contents: [
        {
          inlineData: {
            data: request.pdfBase64,
            mimeType: "application/pdf",
          },
        },
        `${documentHeader}Please analyze this attached PDF document and extract the structured Kanban task according to the rules.`,
      ],
      responseJsonSchema: documentTaskJsonSchema,
    };
  }

  return {
    systemInstruction,
    contents: `${documentHeader}Document Content:\n${request.documentText || ""}`,
    responseJsonSchema: documentTaskJsonSchema,
  };
}
