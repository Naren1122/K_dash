import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Kanban Task Board",
  description: "Sign in to access your Kanban boards",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
