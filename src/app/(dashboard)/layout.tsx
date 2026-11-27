import { redirect } from "next/navigation";
import { getCachedSession } from "@/lib/data/session.data";
import { AppShell } from "@/components/layout/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCachedSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <AppShell user={session.user}>{children}</AppShell>;
}
