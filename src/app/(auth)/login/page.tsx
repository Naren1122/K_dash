import { Suspense } from "react";
import { redirect } from "next/navigation";

import { auth } from "../../../../auth";
import { LoginForm } from "@/components/shared/login-form";

export default async function LoginPage() {
  let session = null;
  try {
    session = await auth();
  } catch (error) {
    console.error("Auth check error on LoginPage:", error);
  }

  if (session?.user) {
    redirect("/board");
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f7fb]" />}>
      <LoginForm />
    </Suspense>
  );
}
