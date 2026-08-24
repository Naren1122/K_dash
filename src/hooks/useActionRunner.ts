"use client";

import { useState, useTransition, useCallback } from "react";
import { useToast } from "@/components/providers/toast-provider";
import type { ActionResult } from "@/lib/error_actions/action-types";
import { formatErrorMessage } from "@/lib/errors/formatters";

export interface ActionRunnerOptions<T> {
  successMessage?: string;
  errorMessage?: string;
  optimistic?: () => void;
  onSuccess?: (data: T) => void;
  onError?: (error: unknown, fieldErrors?: Record<string, string[]>) => void;
}

export function parseActionErrorMessage(error: unknown): string {
  return formatErrorMessage(error);
}

function isActionResult<T>(result: unknown): result is ActionResult<T> {
  return (
    typeof result === "object" &&
    result !== null &&
    "success" in result &&
    typeof (result as { success: unknown }).success === "boolean"
  );
}

export function useActionRunner() {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const clearErrors = useCallback(() => {
    setError(null);
    setFieldErrors(null);
    setErrorCode(null);
  }, []);

  const run = useCallback(
    <T>(action: () => Promise<T | ActionResult<T>>, options?: ActionRunnerOptions<T>) => {
      clearErrors();

      startTransition(async () => {
        if (options?.optimistic) {
          options.optimistic();
        }

        try {
          const result = await action();

          // Check if result is an ActionResult union type
          if (isActionResult<T>(result)) {
            if (!result.success) {
              const message = options?.errorMessage || result.error || "Action failed";
              setError(message);
              setFieldErrors(result.fieldErrors || null);
              setErrorCode(result.code || null);
              showToast(message, "error");
              options?.onError?.(new Error(message), result.fieldErrors);
              return;
            }

            if (options?.successMessage) {
              showToast(options.successMessage, "success");
            }
            options?.onSuccess?.(result.data);
            return;
          }

          // Direct return value
          if (options?.successMessage) {
            showToast(options.successMessage, "success");
          }
          options?.onSuccess?.(result as T);
        } catch (caughtError) {
          const message = options?.errorMessage || parseActionErrorMessage(caughtError);
          setError(message);
          showToast(message, "error");
          options?.onError?.(caughtError);
        }
      });
    },
    [clearErrors, showToast]
  );

  return {
    run,
    error,
    setError,
    fieldErrors,
    setFieldErrors,
    errorCode,
    clearErrors,
    isPending,
  };
}
