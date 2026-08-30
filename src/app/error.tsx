"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/error/error-fallback";
import { logger } from "@/lib/utils/logger";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("app_segment_error", {
      name: error.name,
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <ErrorFallback
        error={error}
        reset={reset}
        title="Something went wrong"
        description="An unexpected error occurred while loading this page. Please try again or return to the board."
      />
    </div>
  );
}
