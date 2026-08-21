import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { Board } from "@/components/board";
import { prisma } from "@/lib/prisma";


export const metadata = {
  title: "Board | Kanban Task Board",
};

export default async function BoardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [tasks, assignees, labels, boardColumnsRaw] = await Promise.all([
    prisma.task.findMany({
      where:
        session.user.role === "ADMIN"
          ? undefined
          : {
            OR: [{ assigneeId: session.user.id }, { assigneeId: null }],
          },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        assignee: { select: { id: true, name: true, email: true } },
        labels: {
          select: {
            label: { select: { id: true, name: true, color: true } },
          },
        },
        comments: {
          orderBy: { createdAt: "asc" },
          take: 100,
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            author: { select: { id: true, name: true, email: true } },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: "MEMBER" },
      orderBy: [{ name: "asc" }, { email: "asc" }],
      select: { id: true, name: true, email: true },
    }),
    prisma.label.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true },
    }),
    prisma.column.findMany({
      orderBy: { position: "asc" },
      select: { id: true, name: true, position: true, status: true, wipLimit: true, boardId: true },
    }),
  ]);

  const boardTasks = tasks.map((task) => ({
    ...task,
    dueDate: task.dueDate?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    labels: task.labels.map(({ label }) => label),
    comments: task.comments.map((comment) => ({
      ...comment,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    })),
  }));

  return (
    <Board
      role={session.user.role}
      assignee={assignees}
      labels={labels}
      tasks={boardTasks}
      boardColumns={boardColumnsRaw}
      userId={session.user.id}
      userName={session.user.name ?? null}
      userEmail={session.user.email ?? ""}
    />
  );
}
