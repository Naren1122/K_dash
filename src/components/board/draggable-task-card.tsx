"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskCard } from "@/components/board/task-card";
import type { Assignee, BoardTask } from "@/components/board/types";
import type { TaskStatusValue } from "@/lib/schemas/taskSchema";

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
    // Exclude dynamic aria-describedby to keep server/client markup stable
    // We'll spread the rest of attributes without aria-describedby
    // Note: TypeScript may warn about unused variable; it's intentional for clarity
  } = useSortable({ id: props.task.id, data: { task: props.task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  // Filter out aria-describedby which can change between renders
  const { "aria-describedby": _ariaDesc, ...cleanAttributes } = attributes as Record<string, any>;

  return (
    <div ref={setNodeRef} style={style} {...cleanAttributes} {...listeners} className="touch-none">
      <TaskCard {...props} />
    </div>
  );
}
