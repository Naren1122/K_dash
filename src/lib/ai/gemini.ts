import "server-only";

import { GoogleGenAI } from "@google/genai";
import { AppError, ErrorCode } from "@/lib/errors";
import { logger } from "@/lib/utils/logger";

const DEFAULT_MODEL = "gemini-3.6-flash";
const TIMEOUT_MS = 15000;

let genAIClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    logger.action("gemini_init_failed", { reason: "missing_api_key" });
    throw new AppError("Gemini API key is not configured. Please set GEMINI_API_KEY in your environment.", {
      statusCode: 500,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
    });
  }

  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey });
  }

  return genAIClient;
}

export type GenerateStructuredContentOptions = {
  model?: string;
  contents: string | Array<string | { inlineData: { data: string; mimeType: string } } | Record<string, unknown>>;
  systemInstruction?: string;
  responseJsonSchema?: Record<string, unknown>;
  temperature?: number;
};


/**
 * Executes a structured content generation call with timeout, validation, and error translation.
 */
export async function generateStructuredContent<T>(
  options: GenerateStructuredContentOptions,
  parser: (raw: unknown) => T
): Promise<T> {
  const ai = getGeminiClient();
  const model = options.model ?? DEFAULT_MODEL;

  try {
    const generatePromise = ai.models.generateContent({
      model,
      contents: options.contents,
      config: {
        systemInstruction: options.systemInstruction,
        temperature: options.temperature ?? 0.2,
        responseMimeType: "application/json",
        responseJsonSchema: options.responseJsonSchema,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new AppError("AI request timed out. Please try again.", {
            statusCode: 504,
            code: ErrorCode.INTERNAL_SERVER_ERROR,
          })
        );
      }, TIMEOUT_MS);
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);
    const responseText = response.text;

    if (!responseText) {
      throw new AppError("AI returned an empty response.", {
        statusCode: 502,
        code: ErrorCode.INTERNAL_SERVER_ERROR,
      });
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(responseText);
    } catch {
      logger.action("gemini_json_parse_error", { raw: responseText.slice(0, 200) });
      throw new AppError("Failed to parse AI response as JSON.", {
        statusCode: 502,
        code: ErrorCode.INTERNAL_SERVER_ERROR,
      });
    }

    return parser(parsedJson);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    logger.action("gemini_generation_error", { error: message });

    // Handle common Google Gen AI API errors
    if (message.includes("429") || message.toLowerCase().includes("quota") || message.toLowerCase().includes("rate limit")) {
      throw new AppError("AI rate limit reached. Please wait a moment and try again.", {
        statusCode: 429,
        code: ErrorCode.INTERNAL_SERVER_ERROR,
      });
    }

    if (message.includes("API key not valid") || message.includes("403") || message.includes("401")) {
      throw new AppError("Invalid or unauthorized Gemini API key.", {
        statusCode: 401,
        code: ErrorCode.UNAUTHORIZED,
      });
    }

    throw new AppError("AI generation failed. You can still complete this action manually.", {
      statusCode: 500,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
    });
  }
}
