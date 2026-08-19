"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useRef, useState } from "react";
import { TaskCard } from "@/components/board/task-card";
import { DroppableColumn } from "@/components/board/droppable-column";
import type { BoardColumn } from "@/components/board/column-types";
import type { Assignee, BoardTask } from "@/components/board/types";
import type { TaskStatusValue } from "@/lib/schemas/taskSchema";

type KanbanViewProps = {
  columns: BoardColumn[];
  tasks: BoardTask[];
  assignee: Assignee[];
  isAdmin: boolean;
  currentUserId: string;
  isPending: boolean;
  onStatusChange: (taskId: string, status: TaskStatusValue) => void;
  onAssigneeChange: (taskId: string, assigneeId: string) => void;
  onView: (task: BoardTask) => void;
  onDelete: (taskId: string) => void;
  onDrop: (taskId: string, newStatus: TaskStatusValue) => void;
};

export function KanbanView({
  columns,
  tasks,
  assignee,
  isAdmin,
  currentUserId,
  isPending,
  onStatusChange,
  onAssigneeChange,
  onView,
  onDelete,
  onDrop,
}: KanbanViewProps) {
  const [activeTask, setActiveTask] = useState<BoardTask | null>(null);
  // Optimistic tasks (for immediate visual feedback during drag)
  const [optimisticTasks, setOptimisticTasks] = useState<BoardTask[]>(tasks);
  const prevTasksRef = useRef<BoardTask[]>(tasks);

  // Sync when tasks prop changes (after server revalidation)
  if (tasks !== prevTasksRef.current) {
    prevTasksRef.current = tasks;
    setOptimisticTasks(tasks);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart({ active }: DragStartEvent) {
    const task = optimisticTasks.find((t) => t.id === active.id);
    setActiveTask(task ?? null);
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find if dragging over a column container or another task
    const overColumn = columns.find((c) => c.id === overId);
    const overTask = optimisticTasks.find((t) => t.id === overId);
    const targetStatus = overColumn?.status ?? overTask?.status;

    if (!targetStatus) return;

    setOptimisticTasks((prev) =>
      prev.map((t) => (t.id === activeId ? { ...t, status: targetStatus as TaskStatusValue } : t)),
    );
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null);

    if (!over) {
      // Revert if dropped nowhere
      setOptimisticTasks(prevTasksRef.current);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const overColumn = columns.find((c) => c.id === overId);
    const overTask = optimisticTasks.find((t) => t.id === overId);
    const targetStatus: TaskStatusValue | undefined =
      (overColumn?.status as TaskStatusValue) ?? (overTask?.status as TaskStatusValue);

    const draggedTask = prevTasksRef.current.find((t) => t.id === activeId);
    if (!draggedTask || !targetStatus) {
      setOptimisticTasks(prevTasksRef.current);
      return;
    }

    if (draggedTask.status !== targetStatus) {
      // Commit server action; revert optimistic if it fails (handled in board.tsx onDrop)
      onDrop(activeId, targetStatus);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <section
        aria-label="Kanban board"
        className="mt-2 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:gap-6"
      >
        {columns.map((column) => {
          const columnTasks = optimisticTasks.filter((t) => t.status === column.status);
          return (
            <DroppableColumn
              key={column.id}
              column={column}
              tasks={columnTasks}
              assignee={assignee}
              isAdmin={isAdmin}
              currentUserId={currentUserId}
              isPending={isPending}
              onStatusChange={onStatusChange}
              onAssigneeChange={onAssigneeChange}
              onView={onView}
              onDelete={onDelete}
            />
          );
        })}
      </section>

      {/* Drag overlay: ghost card following cursor */}
      <DragOverlay>
        {activeTask ? (
          <div className="rotate-2 scale-105 shadow-2xl opacity-90">
            <TaskCard
              task={activeTask}
              assignee={assignee}
              isAdmin={isAdmin}
              currentUserId={currentUserId}
              isPending={false}
              onStatusChange={() => {}}
              onAssigneeChange={() => {}}
              onView={() => {}}
              onDelete={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
