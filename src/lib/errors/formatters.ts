import { ZodError } from "zod";
import { AppError } from "./app-error";
import { ErrorCode } from "./error-codes";

/**
 * Extracts field-level error messages from a ZodError object into a key -> string[] map.
 */
export function formatZodIssues(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.join(".") : "_form";
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(issue.message);
  }

  return fieldErrors;
}

/**
 * Extracts a single primary human-readable message from a ZodError.
 */
export function formatZodErrorMessage(error: ZodError): string {
  if (error.issues.length === 0) return "Invalid input";
  return error.issues.map((i) => i.message).join("; ");
}

/**
 * Extracts a safe, user-friendly error message from an arbitrary thrown error.
 */
export function formatErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred. Please try again."
): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof ZodError) {
    return formatZodErrorMessage(error);
  }

  if (error instanceof Error && error.message) {
    // Check if error is an operational/action error with message
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return fallback;
}

/**
 * Resolves the ErrorCode from an arbitrary error.
 */
export function getErrorCode(error: unknown): ErrorCode {
  if (error instanceof AppError) {
    return error.code;
  }
  if (error instanceof ZodError) {
    return ErrorCode.VALIDATION_ERROR;
  }
  return ErrorCode.INTERNAL_SERVER_ERROR;
}
