import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { Board } from "@/components/board";
import { getBoardTasks } from "@/lib/data/tasks";
import { getAssignees } from "@/lib/data/users";
import { getBoardLabels } from "@/lib/data/labels";
import { getBoardColumns } from "@/lib/data/columns";

export const metadata = {
  title: "Board | Kanban Task Board",
};

export default async function BoardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [boardTasks, assignees, labels, boardColumnsRaw] = await Promise.all([
    getBoardTasks(session.user.id, session.user.role),
    getAssignees(),
    getBoardLabels(),
    getBoardColumns(),
  ]);

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

