"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, UserPlus, X } from "lucide-react";

import {
  createUserSchema,
  CreateUserFormValues,
  CreateUserInput,
} from "@/lib/schemas/usersSchema";
import { createUser } from "@/lib/actions/users";
import { Input } from "@/components/ui/input";
import { useActionRunner } from "@/hooks/useActionRunner";
import { useToast } from "@/components/providers/toast-provider";

type CreateUserDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function CreateUserDialog({ isOpen, onClose }: CreateUserDialogProps) {
  const [visible, setVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const { run, error: serverError, isPending: isSubmitting } = useActionRunner();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormValues, unknown, CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "MEMBER",
    },
  });

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!isOpen) return null;

  function onSubmit(data: CreateUserInput) {
    run(() => createUser(data), {
      onSuccess: (result) => {
        showToast(`User ${result.email} added successfully as ${result.role}`, "success");
        reset();
        onClose();
      },
    });
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  }

  const { ref: nameRegisterRef, ...nameRest } = register("name");

  return (
    <div
      className={`fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm transition-all duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-user-title"
    >
      <div
        className={`w-full max-w-lg rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-2xl transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 ${
          visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 id="create-user-title" className="text-base font-bold text-slate-900 dark:text-white">
                Add Team Member
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create a new user account with credentials and workspace role.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800">
            {serverError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Full Name <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <Input
              {...nameRest}
              ref={(e) => {
                nameRegisterRef(e);
                firstInputRef.current = e;
              }}
              type="text"
              placeholder="e.g. Maya Lin"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <Input
              {...register("email")}
              type="email"
              placeholder="e.g. maya@company.com"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                disabled={isSubmitting}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Role
            </label>
            <div className="mt-1 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-white">Member (Standard Workspace Access)</span>
              <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                Member Role
              </span>
            </div>
            <input type="hidden" {...register("role")} value="MEMBER" />
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer dark:bg-sky-500 dark:hover:bg-sky-600"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                "Create Member"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
