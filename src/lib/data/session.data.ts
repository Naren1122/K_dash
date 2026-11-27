import { cache } from "react";
import { auth } from "@/auth";

/**
 * Deduplicated session lookup for the current server request lifecycle.
 * Prevents redundant auth() database/token queries between layout and pages.
 */
export const getCachedSession = cache(async () => {
  return await auth();
});
