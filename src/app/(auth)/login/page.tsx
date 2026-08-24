import { Suspense } from "react";
import { LoginForm } from "@/components/shared/login-form";

export const metadata = {
  title: "Login | Kanban Task Board",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f7fb]" />}>
      <LoginForm />
    </Suspense>
  );
}
