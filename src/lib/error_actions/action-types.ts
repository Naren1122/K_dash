import type { ErrorCode } from "@/lib/errors";

export type ActionSuccess<T> = {
  success: true;
  data: T;
  error?: never;
  code?: never;
  fieldErrors?: never;
};

export type ActionFailure = {
  success: false;
  error: string;
  code?: ErrorCode;
  statusCode?: number;
  fieldErrors?: Record<string, string[]>;
  data?: never;
};

export type ActionResult<T> = ActionSuccess<T> | ActionFailure;
