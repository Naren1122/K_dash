import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { Board } from "@/components/board";
import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const tasks = await prisma.task.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      assignee: { select: { id: true, name: true, email: true } },
    },
  });

  const assignees = await prisma.user.findMany({
    where: { role: "MEMBER" },
    orderBy: [{ name: "asc" }, { email: "asc" }],
    select: { id: true, name: true, email: true },
  });

  const boardTasks = tasks.map((task) => ({
    ...task,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  }));

  return (
    <AppShell user={session.user}>
      <Board
        role={session.user.role}
        assignee={assignees}
        tasks={boardTasks}
        userId={session.user.id}
      />
    </AppShell>
  );
}
