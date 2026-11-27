import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "Forgot Password | Kanban Task Board",
  description: "Reset your Kanban Task Board account password via email verification.",
};

export default async function ForgotPasswordPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/board");
  }

  return (
    <main className="min-h-screen bg-[#f8f9ff] dark:bg-[#0b101b] p-4 sm:p-6 lg:p-10 flex items-center justify-center">
      <Suspense fallback={<div className="min-h-screen" />}>
        <ForgotPasswordForm />
      </Suspense>
    </main>
  );
}
