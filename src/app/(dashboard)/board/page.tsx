import { redirect } from "next/navigation";
import { getCachedSession } from "@/lib/data/session.data";
import { Board } from "@/components/board";
import { findBoardTasksInDb } from "@/lib/data/task.data";
import { getAssignees } from "@/lib/data/user.data";
import { getBoardLabelsFromDb } from "@/lib/data/label.data";
import { getBoardColumnsFromDb } from "@/lib/data/column.data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Board | Kanban Task Board",
};

export default async function BoardPage() {
  const session = await getCachedSession();

  if (!session?.user) {
    redirect("/login");
  }

  const [boardTasks, assignees, labels, boardColumnsRaw] = await Promise.all([
    findBoardTasksInDb(session.user.id, session.user.role),
    getAssignees(),
    getBoardLabelsFromDb(),
    getBoardColumnsFromDb(),
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
