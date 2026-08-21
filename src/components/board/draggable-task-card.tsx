"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskCard } from "@/components/board/task-card";
import type { Assignee, BoardTask } from "@/types/types";
import type { TaskStatusValue } from "@/lib/schemas/tasksSchema";

type DraggableTaskCardProps = {
  task: BoardTask;
  assignee: Assignee[];
  isAdmin: boolean;
  currentUserId: string;
  isPending: boolean;
  onStatusChange: (taskId: string, status: TaskStatusValue) => void;
  onAssigneeChange: (taskId: string, assigneeId: string) => void;
  onView: (task: BoardTask) => void;
  onDelete: (taskId: string) => void;
};

export function DraggableTaskCard(props: DraggableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.task.id, data: { task: props.task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  const cleanAttributes = { ...(attributes as unknown as Record<string, unknown>) };
  delete cleanAttributes["aria-describedby"];

  return (
    <div ref={setNodeRef} style={style} {...cleanAttributes} {...listeners} className="touch-none">
      <TaskCard {...props} />
    </div>
  );
}
