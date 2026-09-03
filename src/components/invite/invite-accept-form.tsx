"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Lock, User, ArrowRight } from "lucide-react";

import {
  acceptInviteSchema,
  AcceptInviteFormValues,
  AcceptInviteInput,
} from "@/lib/schemas/invitationSchema";
import { acceptInvitation } from "@/lib/actions/invitations";
import { Input } from "@/components/ui/input";

interface InviteAcceptFormProps {
  token: string;
  initialEmail: string;
  initialName?: string | null;
  inviterName: string;
}

export function InviteAcceptForm({
  token,
  initialEmail,
  initialName,
  inviterName,
}: InviteAcceptFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInviteFormValues, unknown, AcceptInviteInput>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      token,
      name: initialName || "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: AcceptInviteInput) {
    setServerError(null);
    try {
      const res = await acceptInvitation(data);
      if (res.success) {
        setIsSuccess(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to activate account. Please try again.";
      setServerError(msg);
    }
  }

  if (isSuccess) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-lg dark:border-emerald-900/60 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
          Invitation Accepted
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Your account has been set up successfully. You can now close this tab.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => window.close()}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-[0.98] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
          <span>Invited by {inviterName}</span>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Set up your account
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Joining workspace as <span className="font-semibold text-slate-800 dark:text-slate-200">{initialEmail}</span>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register("token")} />

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Display Name
          </label>
          <div className="relative mt-1">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="e.g. Sarah Connor"
              className="pl-9"
              {...register("name")}
            />
          </div>
          {errors.name ? (
            <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
              {errors.name.message}
            </p>
          ) : null}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Create Password
          </label>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="password"
              placeholder="At least 8 characters"
              className="pl-9"
              {...register("password")}
            />
          </div>
          {errors.password ? (
            <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Confirm Password
          </label>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="password"
              placeholder="Repeat your password"
              className="pl-9"
              {...register("confirmPassword")}
            />
          </div>
          {errors.confirmPassword ? (
            <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>

        {serverError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300">
            {serverError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {isSubmitting ? (
            "Activating account..."
          ) : (
            <>
              Activate Account & Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
