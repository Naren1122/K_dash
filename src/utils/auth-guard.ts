import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { Role } from "@/types/prisma";

export async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  if (session.user.role !== Role.ADMIN) {
    redirect("/403");
  }

  return session.user;
}
