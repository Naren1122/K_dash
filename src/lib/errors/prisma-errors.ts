import { Prisma } from "@/lib/types/prisma_type";

import {
  AppError,
  ConflictError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "./app-error";

/**
 * Maps known Prisma errors to structured domain AppError instances.
 * Prevents internal database connection strings, table details, or raw queries from leaking.
 */
export function handleDatabaseError(error: unknown, resourceName = "Record"): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      // P2002: Unique constraint failed
      case "P2002": {
        const target = (error.meta?.target as string[] | string) || "field";
        const fieldName = Array.isArray(target) ? target.join(", ") : target;
        return new ConflictError(
          `A ${resourceName.toLowerCase()} with this ${fieldName} already exists.`
        );
      }

      // P2025: Record not found
      case "P2025": {
        return new NotFoundError(resourceName);
      }

      // P2003: Foreign key constraint failed
      case "P2003": {
        const field = (error.meta?.field_name as string) || "referenced item";
        return new ValidationError(`Invalid reference: The related ${field} does not exist.`);
      }

      // P2014: Required relation violation
      case "P2014": {
        return new ConflictError(
          `The change cannot be completed because required relationships would be violated.`
        );
      }

      // P2000: Value too long for column
      case "P2000": {
        return new ValidationError(`Provided input value exceeds the maximum allowable length.`);
      }

      default:
        return new DatabaseError(
          `Database operation failed with error code ${error.code}.`,
          { code: error.code }
        );
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new ValidationError("Invalid data provided for database operation.");
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new DatabaseError("Unable to establish a connection with the database.");
  }

  if (error instanceof Error) {
    return new DatabaseError(error.message);
  }

  return new DatabaseError("An unknown database error occurred.");
}
