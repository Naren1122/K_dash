"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/providers/toast-provider";
import { loginSchema, LoginInput } from "@/lib/schemas/loginSchema";
import { logger } from "@/lib/utils/logger";

const loginLogger = (...args: Parameters<typeof logger.auth>) => logger.auth(...args);

export function LoginForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { showToast } = useToast();
  const initialEmail = searchParams.get("email") || "";

  const urlError = useMemo(() => {
    const err = searchParams.get("error");
    if (err === "AccessDenied") {
      return "Access Denied: Your Google account is not registered. You must be invited by an administrator first.";
    }
    if (err === "InviteNotAccepted") {
      return "Please accept your Gmail invitation link first before signing in with Google.";
    }
    if (err === "OAuthAccountNotLinked") {
      return "An account with this email already exists. Please sign in with your email and password.";
    }
    if (err === "OAuthSignin" || err === "OAuthCallbackError") {
      return "Google sign-in was cancelled or encountered an error. Please try again.";
    }
    return null;
  }, [searchParams]);

  const displayError = error || urlError;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: initialEmail, password: "" },
  });

  useEffect(() => {
    if (initialEmail) {
      setValue("email", initialEmail);
    }

    if (searchParams.get("verified") === "true") {
      showToast("Account activated successfully! Please sign in with your password or Google 🎉", "success");
    } else if (searchParams.get("message") === "signed_out") {
      loginLogger("signed_out_page_view");
      showToast("You've been signed out. See you next time! 👋", "info");
    }
  }, [searchParams, initialEmail, setValue, showToast]);

  async function onSubmit(data: LoginInput) {
    setError(null);
    loginLogger("login_submit_attempt", { email: data.email });

    const rawCallback = searchParams.get("callbackUrl");
    const callbackUrl = !rawCallback || rawCallback === "/" ? "/board" : rawCallback;

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      loginLogger("login_failed", { email: data.email, error: result.error });
      setError("Invalid email or password.");
      return;
    }

    loginLogger("login_success", { email: data.email });
    showToast("Welcome back! Signing you in... 🚀", "success");
    setTimeout(() => {
      window.location.href = callbackUrl;
    }, 300);
  }

  function handleGoogleSignIn() {
    setError(null);
    setIsGoogleLoading(true);
    const rawCallback = searchParams.get("callbackUrl");
    const callbackUrl = !rawCallback || rawCallback === "/" ? "/board" : rawCallback;
    signIn("google", { callbackUrl });
  }

  return (
    <main className="min-h-screen bg-[#f8f9ff] dark:bg-[#0b101b] p-4 sm:p-6 lg:p-10 flex items-center justify-center">
      <div className="w-full max-w-[1200px] grid overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.12)] lg:grid-cols-2">
        {/* Left Stitch Brand Panel */}
        <section className="relative hidden overflow-hidden bg-[#111625] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full border-[32px] border-sky-500/10" />
          <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-gradient-to-br from-sky-500/20 to-blue-600/10 blur-3xl" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white font-black text-lg shadow-md shadow-sky-500/25">
              K
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white block">K-Dash</span>
              <span className="text-[11px] text-slate-400 font-medium">Enterprise Project Board</span>
            </div>
          </div>

          <div className="relative max-w-md my-auto py-8">
            <p className="text-xs font-extrabold uppercase tracking-widest text-sky-400">
              Corporate Modern Workspace
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-white">
              Turn plans into meaningful progress.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              A high-precision, collaborative Kanban workspace engineered for clarity, speed, and real-time team synchronization.
            </p>
            <div className="mt-8 flex items-center gap-2">
              <span className="h-1.5 w-8 rounded-full bg-sky-400" />
              <span className="h-1.5 w-2 rounded-full bg-slate-700" />
              <span className="h-1.5 w-2 rounded-full bg-slate-700" />
            </div>
          </div>

          <div className="relative flex items-center justify-between text-xs text-slate-400 pt-6 border-t border-slate-800/80">
            <span>Role-Based Auth • Real-Time • AI-Powered</span>
            <span className="font-semibold text-slate-300">v2.0</span>
          </div>
        </section>

        {/* Right Form Panel */}
        <section className="flex flex-col justify-center p-8 sm:p-12 lg:p-14">
          <div className="w-full max-w-md mx-auto">
            <div className="flex items-center gap-3 lg:hidden mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white font-bold text-base">
                K
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">K-Dash</span>
                <span className="text-xs text-slate-400">Project Management</span>
              </div>
            </div>

            <p className="text-xs font-extrabold uppercase tracking-widest text-sky-600 dark:text-sky-400">
              Welcome back
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              Sign in to workspace
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Enter your credentials below or continue with your verified Google account.
            </p>

            {/* Google Sign In Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isSubmitting}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3.5 text-sm font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300 active:scale-[0.99] dark:border-slate-800 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-60"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                {isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}
              </button>

              <div className="relative my-6 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200/80 dark:border-slate-800" />
                </div>
                <div className="relative bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:bg-slate-900">
                  Or with password
                </div>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5" htmlFor="email">
                  Email Address
                </label>
                <input
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-white dark:focus:border-sky-400 dark:focus:ring-sky-950/60"
                  id="email"
                  type="email"
                  placeholder="admin@kanban.local"
                  {...register("email")}
                />
                {errors.email ? <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{errors.email.message}</p> : null}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5" htmlFor="password">
                  Password
                </label>
                <input
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-white dark:focus:border-sky-400 dark:focus:ring-sky-950/60"
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                />
                {errors.password ? <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{errors.password.message}</p> : null}
              </div>

              {displayError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300" role="alert">
                  {displayError}
                </div>
              ) : null}

              <button
                className="w-full rounded-xl bg-slate-950 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer dark:bg-sky-500 dark:hover:bg-sky-600"
                disabled={isSubmitting || isGoogleLoading}
                type="submit"
              >
                {isSubmitting ? "Signing in..." : "Sign In with Password"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
