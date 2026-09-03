import "server-only";

import mammoth from "mammoth";
import { AppError, ErrorCode } from "@/lib/errors";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type ExtractedDocumentPayload = {
  fileName: string;
  text?: string;
  base64Data?: string;
  mimeType: string;
  isPdf: boolean;
};

/**
 * Extracts and prepares document payloads (PDF via base64 for Gemini native multimodal ingestion, Word DOCX via mammoth, TXT/MD/CSV via UTF-8 string decoding).
 */
export async function processDocumentFile(file: File): Promise<ExtractedDocumentPayload> {
  const fileName = file.name || "uploaded-document";
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  const size = file.size;

  if (size > MAX_FILE_SIZE) {
    throw new AppError("File size exceeds maximum limit of 10MB.", {
      statusCode: 400,
      code: ErrorCode.BAD_REQUEST,
    });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (extension === "docx" || extension === "doc") {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.trim();

      if (!text || text.length < 5) {
        throw new AppError(
          "The uploaded Word document contains no readable text.",
          {
            statusCode: 400,
            code: ErrorCode.BAD_REQUEST,
          }
        );
      }

      return {
        fileName,
        text,
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        isPdf: false,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        `Failed to parse Word document: ${err instanceof Error ? err.message : "Unknown error"}`,
        {
          statusCode: 400,
          code: ErrorCode.BAD_REQUEST,
        }
      );
    }
  }

  if (extension === "pdf" || file.type === "application/pdf") {
    const base64Data = buffer.toString("base64");
    if (!base64Data) {
      throw new AppError("Failed to read PDF document file.", {
        statusCode: 400,
        code: ErrorCode.BAD_REQUEST,
      });
    }

    return {
      fileName,
      base64Data,
      mimeType: "application/pdf",
      isPdf: true,
    };
  }

  if (
    extension === "txt" ||
    extension === "md" ||
    extension === "markdown" ||
    extension === "csv" ||
    extension === "json" ||
    file.type.startsWith("text/")
  ) {
    const text = buffer.toString("utf-8").trim();
    if (!text || text.length < 5) {
      throw new AppError(
        "The uploaded text document contains no readable content.",
        {
          statusCode: 400,
          code: ErrorCode.BAD_REQUEST,
        }
      );
    }

    return {
      fileName,
      text,
      mimeType: file.type || "text/plain",
      isPdf: false,
    };
  }

  // Fallback UTF-8 text decode attempt
  try {
    const text = buffer.toString("utf-8").trim();
    if (text && text.length >= 5) {
      return {
        fileName,
        text,
        mimeType: "text/plain",
        isPdf: false,
      };
    }
  } catch {
    // ignore
  }

  throw new AppError(
    `Unsupported document format (.${extension}). Please upload a PDF, Word (.docx), or Text (.txt, .md) file.`,
    {
      statusCode: 400,
      code: ErrorCode.BAD_REQUEST,
    }
  );
}
