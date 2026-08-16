import { requireAdmin } from "@/lib/auth-guard";
import { AppShell } from "@/components/layout/app-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return <AppShell user={user}>{children}</AppShell>;
}
