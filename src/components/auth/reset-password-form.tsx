"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import {
  resetPasswordSchema,
  ResetPasswordFormValues,
  ResetPasswordInput,
} from "@/lib/schemas/passwordResetSchema";
import { resetPassword } from "@/lib/actions/auth";

interface ResetPasswordFormProps {
  token: string;
  email: string;
}

export function ResetPasswordForm({ token, email }: ResetPasswordFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues, unknown, ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password") || "";
  const hasMinLength = passwordValue.length >= 8;
  const hasUppercase = /[A-Z]/.test(passwordValue);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(passwordValue);

  async function onSubmit(data: ResetPasswordInput) {
    setServerError(null);
    try {
      const res = await resetPassword(data);
      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/login?message=password_reset_success");
        }, 1200);
      } else {
        setServerError(res.error || "Failed to reset password. Please try again.");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setServerError(msg);
    }
  }

  if (isSuccess) {
    return (
      <div className="w-full max-w-md rounded-3xl border border-emerald-200/80 bg-white p-8 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.12)] text-center dark:border-emerald-900/60 dark:bg-slate-900 sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400 shadow-inner">
          <CheckCircle2 className="h-7 w-7" />
        </div>

        <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Password Reset Complete
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Your password has been updated securely. Redirecting you to sign in...
        </p>

        <div className="mt-8">
          <button
            type="button"
            onClick={() => router.push("/login?message=password_reset_success")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 cursor-pointer"
          >
            Sign In Now
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900 sm:p-10">
      {/* Header */}
      <div className="mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Create New Password
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Resetting password for <span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span>
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
            htmlFor="password"
          >
            New Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-white dark:focus:border-sky-400 dark:focus:ring-sky-950/60"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password ? (
            <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        {/* Password Strength Checklist */}
        <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/50 text-[11px] space-y-1.5">
          <p className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
            Password Requirements:
          </p>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <div className={`h-1.5 w-1.5 rounded-full ${hasMinLength ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`} />
            <span className={hasMinLength ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""}>
              At least 8 characters
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <div className={`h-1.5 w-1.5 rounded-full ${hasUppercase ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`} />
            <span className={hasUppercase ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""}>
              At least one uppercase letter (A-Z)
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <div className={`h-1.5 w-1.5 rounded-full ${hasSpecial ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`} />
            <span className={hasSpecial ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""}>
              At least one special character (!@#$%...)
            </span>
          </div>
        </div>

        <div>
          <label
            className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
            htmlFor="confirmPassword"
          >
            Confirm New Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-white dark:focus:border-sky-400 dark:focus:ring-sky-950/60"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword ? (
            <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-slate-950 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer dark:bg-sky-500 dark:hover:bg-sky-600"
        >
          {isSubmitting ? "Updating Password..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
