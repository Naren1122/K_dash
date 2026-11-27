import Link from "next/link";
import { AlertCircle, ArrowLeft, KeyRound } from "lucide-react";
import { verifyResetToken } from "@/lib/actions/auth";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = {
  title: "Reset Password | Kanban Task Board",
  description: "Set a new password for your account on Kanban Task Board.",
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="min-h-screen bg-[#f8f9ff] dark:bg-[#0b101b] p-4 sm:p-6 lg:p-10 flex items-center justify-center">
        <div className="w-full max-w-md rounded-3xl border border-red-200/80 bg-white p-8 text-center shadow-[0_24px_60px_-15px_rgba(15,23,42,0.12)] dark:border-red-900/60 dark:bg-slate-900 sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/70 dark:text-red-400">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Missing Reset Token
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            No reset token was provided. Please make sure you clicked the complete link in your email.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/forgot-password"
              className="w-full rounded-xl bg-slate-950 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-600 inline-block"
            >
              Request New Link
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition pt-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const verification = await verifyResetToken(token);

  if (!verification.valid || !verification.email) {
    return (
      <main className="min-h-screen bg-[#f8f9ff] dark:bg-[#0b101b] p-4 sm:p-6 lg:p-10 flex items-center justify-center">
        <div className="w-full max-w-md rounded-3xl border border-amber-200/80 bg-white p-8 text-center shadow-[0_24px_60px_-15px_rgba(15,23,42,0.12)] dark:border-amber-900/60 dark:bg-slate-900 sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Invalid or Expired Link
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {verification.error || "This password reset link is invalid or has expired."}
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/forgot-password"
              className="w-full rounded-xl bg-slate-950 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-600 inline-block"
            >
              Request a New Reset Link
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition pt-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f9ff] dark:bg-[#0b101b] p-4 sm:p-6 lg:p-10 flex items-center justify-center">
      <ResetPasswordForm token={token} email={verification.email} />
    </main>
  );
}
