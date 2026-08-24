import { ErrorCode } from "./error-codes";

export interface AppErrorOptions {
  cause?: unknown;
  code?: ErrorCode;
  statusCode?: number;
  details?: unknown;
  isOperational?: boolean;
}

/**
 * Base Application Error class representing operational errors.
 * custom error classes for specific error types.
 
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code || ErrorCode.INTERNAL_SERVER_ERROR;
    this.statusCode = options.statusCode || 500;
    this.details = options.details;
    this.isOperational = options.isOperational ?? true;

    if (options.cause) {
      this.cause = options.cause;
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", details?: unknown) {
    super(message, {
      code: ErrorCode.BAD_REQUEST,
      statusCode: 400,
      details,
    });
  }
}

export class ValidationError extends AppError {
  public readonly fieldErrors?: Record<string, string[]>;

  constructor(
    message = "Validation failed",
    fieldErrors?: Record<string, string[]>,
    details?: unknown,
  ) {
    super(message, {
      code: ErrorCode.VALIDATION_ERROR,
      statusCode: 400,
      details: details || fieldErrors,
    });
    this.fieldErrors = fieldErrors;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized: Please log in to continue") {
    super(message, {
      code: ErrorCode.UNAUTHORIZED,
      statusCode: 401,
    });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden: You do not have permission to perform this action") {
    super(message, {
      code: ErrorCode.FORBIDDEN,
      statusCode: 403,
    });
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource", id?: string | number) {
    const msg = id ? `${resource} with ID '${id}' was not found` : `${resource} not found`;
    super(msg, {
      code: ErrorCode.NOT_FOUND,
      statusCode: 404,
    });
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists or conflicts with current state") {
    super(message, {
      code: ErrorCode.CONFLICT,
      statusCode: 409,
    });
  }
}

export class DatabaseError extends AppError {
  constructor(message = "A database error occurred", details?: unknown) {
    super(message, {
      code: ErrorCode.DATABASE_ERROR,
      statusCode: 500,
      details,
      isOperational: true,
    });
  }
}

export class InternalServerError extends AppError {
  constructor(message = "An internal server error occurred", details?: unknown) {
    super(message, {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      statusCode: 500,
      details,
      isOperational: false,
    });
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
