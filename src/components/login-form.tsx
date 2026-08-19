"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import { loginSchema, LoginInput } from "@/lib/schemas/loginSchema";
import { logger } from "@/lib/utils/logger";

const loginLogger = (...args: Parameters<typeof logger.auth>) => logger.auth(...args);

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "admin@kanban.local", password: "Admin123!" },
  });

  useEffect(() => {
    if (searchParams.get("message") === "signed_out") {
      loginLogger("signed_out_page_view");
      showToast("You've been signed out. See you next time! 👋", "info");
    }
  }, [searchParams, showToast]);

  async function onSubmit(data: LoginInput) {
    setError(null);
    loginLogger("login_submit_attempt", { email: data.email });

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
    setTimeout(() => { router.replace("/"); router.refresh(); }, 600);
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-3 sm:p-5 lg:p-7">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1400px] overflow-hidden rounded-[1.75rem] bg-white shadow-[0_28px_80px_-35px_rgba(15,23,42,0.35)] lg:min-h-[calc(100vh-3.5rem)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full border-[38px] border-sky-400/10" /><div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-gradient-to-br from-sky-500/20 to-indigo-500/5 blur-2xl" />
          <div className="relative flex items-center gap-3"><div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5"><Image alt="Kanban logo" className="h-full w-full object-contain" height={56} priority src="/Screenshot 2026-07-23 143649.png" width={56} /></div><span className="text-lg font-bold tracking-tight">Kanban Task Board</span></div>
          <div className="relative max-w-md"><p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Clarity in every task</p><h1 className="mt-5 text-5xl font-bold leading-[1.08] tracking-tight">Turn plans into meaningful progress.</h1><p className="mt-6 max-w-sm text-base leading-7 text-slate-300">A calm, collaborative space for keeping the right work moving at the right time.</p><div className="mt-10 flex gap-3"><span className="h-1.5 w-12 rounded-full bg-sky-400" /><span className="h-1.5 w-5 rounded-full bg-white/30" /><span className="h-1.5 w-5 rounded-full bg-white/30" /></div></div>
          <p className="relative text-sm text-slate-400">Simple flow. Shared focus. Better outcomes.</p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-md">
            <div className="flex items-center gap-3 lg:hidden"><div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-slate-950 p-1"><Image alt="Kanban logo" className="h-full w-full object-contain" height={48} priority src="/Screenshot 2026-07-23 143649.png" width={48} /></div><span className="font-bold text-slate-900">Kanban Task Board</span></div>
            <p className="mt-10 text-xs font-bold uppercase tracking-[0.2em] text-sky-600 lg:mt-0">Welcome back</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Sign in to your workspace</h2><p className="mt-3 text-sm leading-6 text-slate-500">Use a seeded account below to explore the board and its role-based controls.</p>
            <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <label className="block text-sm font-bold text-slate-700" htmlFor="email">Email<input autoComplete="email" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" id="email" type="email" {...register("email")} /></label>
              {errors.email ? <p className="text-xs font-medium text-red-600">{errors.email.message}</p> : null}
              <label className="block text-sm font-bold text-slate-700" htmlFor="password">Password<input autoComplete="current-password" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" id="password" type="password" {...register("password")} /></label>
              {errors.password ? <p className="text-xs font-medium text-red-600">{errors.password.message}</p> : null}
              {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}
              <button className="w-full rounded-xl bg-slate-950 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">{isSubmitting ? "Signing in..." : "Sign in to board"}</button>
            </form>
            {/* <div className="mt-8 rounded-2xl border border-sky-100 bg-sky-50/70 p-4 text-xs leading-5 text-slate-600"><p className="font-bold text-slate-800">Demo accounts</p><div className="mt-2 grid gap-1"><p><span className="font-semibold">Admin:</span> admin@kanban.local / Admin123!</p><p><span className="font-semibold">Maya:</span> maya@kanban.local / Member123!</p><p><span className="font-semibold">Liam:</span> liam@kanban.local / Member123!</p></div></div> */}
          </div>
        </section>
      </div>
    </main>
  );
}
