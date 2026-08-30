import { ZodError, type z } from "zod";
import {
  AppError,
  ErrorCode,
  formatErrorMessage,
  formatZodIssues,
  handleDatabaseError,
} from "@/lib/errors";
import { logger } from "@/lib/utils/logger";
import type { ActionFailure, ActionResult } from "./action-types";

/**
 * Standardized server-side error normalizer for Server Actions.
 * Catches any thrown error and formats it into an ActionFailure without crashing.
 */
export function handleActionError(error: unknown, actionName = "unnamed_action"): ActionFailure {
  // 1. Zod validation error
  if (error instanceof ZodError) {
    const fieldErrors = formatZodIssues(error);
    const message = formatErrorMessage(error);
    logger.action(`${actionName}_validation_failed`, { fieldErrors });
    return {
      success: false,
      error: message,
      code: ErrorCode.VALIDATION_ERROR,
      statusCode: 400,
      fieldErrors,
    };
  }

  // 2. Domain AppError
  if (error instanceof AppError) {
    logger.action(`${actionName}_app_error`, {
      code: error.code,
      statusCode: error.statusCode,
      message: error.message,
    });
    return {
      success: false,
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      fieldErrors: error.details && typeof error.details === "object" ? (error.details as Record<string, string[]>) : undefined,
    };
  }

  // 3. Database / Prisma error check
  if (
    error &&
    typeof error === "object" &&
    "name" in error &&
    typeof (error as { name: unknown }).name === "string" &&
    ((error as { name: string }).name.startsWith("Prisma") || (error as { code?: unknown }).code?.toString().startsWith("P"))
  ) {
    const mapped = handleDatabaseError(error);
    logger.error(`${actionName}_database_error`, {
      message: mapped.message,
      code: mapped.code,
    });
    return {
      success: false,
      error: mapped.message,
      code: mapped.code,
      statusCode: mapped.statusCode,
    };
  }

  // 4. Legacy ActionError or general Error
  if (error instanceof Error) {
    const isActionError = "status" in error && typeof (error as { status: unknown }).status === "number";
    const status = isActionError ? ((error as { status: number }).status) : 500;

    logger.action(`${actionName}_error`, {
      name: error.name,
      message: error.message,
      status,
    });

    return {
      success: false,
      error: error.message || "An unexpected error occurred",
      statusCode: status,
      code: status === 401 ? ErrorCode.UNAUTHORIZED : status === 403 ? ErrorCode.FORBIDDEN : status === 404 ? ErrorCode.NOT_FOUND : ErrorCode.INTERNAL_SERVER_ERROR,
    };
  }

  // 5. Unknown error fallback
  logger.error(`${actionName}_unexpected_error`, { error });
  return {
    success: false,
    error: "An unexpected error occurred. Please try again.",
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    statusCode: 500,
  };
}

export interface SafeActionOptions<TInput, TOutput> {
  actionName: string;
  schema?: z.ZodType<TInput>;
  handler: (parsedInput: TInput) => Promise<TOutput>;
}

/**
 * Creates a safe Server Action with built-in validation and global error handling.
 */
export async function safeServerAction<TInput, TOutput>(
  options: SafeActionOptions<TInput, TOutput>,
  rawInput: unknown
): Promise<ActionResult<TOutput>> {
  const { actionName, schema, handler } = options;

  try {
    let parsedInput = rawInput as TInput;
    if (schema) {
      const parseResult = schema.safeParse(rawInput);
      if (!parseResult.success) {
        return handleActionError(parseResult.error, actionName);
      }
      parsedInput = parseResult.data;
    }

    const data = await handler(parsedInput);
    return {
      success: true,
      data,
    };
  } catch (error) {
    return handleActionError(error, actionName);
  }
}
