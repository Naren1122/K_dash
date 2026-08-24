import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { LoginForm } from "@/components/shared/login-form";

export const metadata = {
  title: "Login | Kanban Task Board",
};

export default async function LoginPage(props: {
  searchParams: Promise<{ message?: string; callbackUrl?: string }>;
}) {
  const searchParams = await props.searchParams;
  if (searchParams?.message !== "signed_out") {
    const session = await auth();
    if (session?.user) {
      redirect("/board");
    }
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f7fb]" />}>
      <LoginForm />
    </Suspense>
  );
}
