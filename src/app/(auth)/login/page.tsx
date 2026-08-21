import { Suspense } from "react";
import { redirect } from "next/navigation";

import { auth } from "../../../../auth";
import { LoginForm } from "@/components/shared/login-form";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/board");
  }

  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
