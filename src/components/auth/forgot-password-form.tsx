"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import {
  forgotPasswordSchema,
  ForgotPasswordInput,
} from "@/lib/schemas/passwordResetSchema";
import { requestPasswordReset } from "@/lib/actions/auth";

export function ForgotPasswordForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(data: ForgotPasswordInput) {
    setServerError(null);
    try {
      const res = await requestPasswordReset(data);
      if (res.success) {
        setSubmittedEmail(data.email);
      } else {
        setServerError("Unable to send reset email. Please try again.");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setServerError(msg);
    }
  }

  if (submittedEmail) {
    return (
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.12)] text-center dark:border-slate-800 dark:bg-slate-900 sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/70 dark:text-sky-400 shadow-inner">
          <CheckCircle2 className="h-7 w-7" />
        </div>

        <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Check your email
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          If an account exists for <span className="font-semibold text-slate-900 dark:text-slate-200">{submittedEmail}</span>, we have sent a secure password reset link.
        </p>

        <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50/50 p-3.5 text-xs text-slate-600 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-slate-400">
          The link will expire in <strong className="text-sky-600 dark:text-sky-400">15 minutes</strong>. If you do not see the email, please check your spam or junk folder.
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setSubmittedEmail(null)}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            Send to another email
          </button>

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 text-sm font-bold text-sky-600 hover:text-sky-500 hover:underline dark:text-sky-400 pt-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900 sm:p-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Forgot Password
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Enter your registered email address and we&apos;ll send you a verification link to reset your password.
        </p>
      </div>

      {serverError ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300" role="alert">
          {serverError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label
            className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
            htmlFor="email"
          >
            Email Address
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="member@kanban.local"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-white dark:focus:border-sky-400 dark:focus:ring-sky-950/60"
              {...register("email")}
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
              <Mail className="h-4 w-4" />
            </div>
          </div>
          {errors.email ? (
            <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-slate-950 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer dark:bg-sky-500 dark:hover:bg-sky-600"
        >
          {isSubmitting ? "Sending Reset Link..." : "Send Reset Link"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
