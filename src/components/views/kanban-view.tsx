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
import { useState, useMemo } from "react";
import { TaskCard } from "@/components/board/task-card";
import { DroppableColumn } from "@/components/board/droppable-column";
import type { BoardColumn } from "@/types/column-types";
import type { Assignee, BoardTask } from "@/types/types";
import type { TaskStatusValue } from "@/lib/schemas/tasksSchema";

type KanbanViewProps = {
  columns: BoardColumn[];
  tasks: BoardTask[];
  assignee: Assignee[];
  isAdmin: boolean;
  currentUserId: string;
  isPending: boolean;
  activeViewersMap?: Record<string, string[]>;
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
  activeViewersMap,
  onStatusChange,
  onAssigneeChange,
  onView,
  onDelete,
  onDrop,
}: KanbanViewProps) {
  const [activeTask, setActiveTask] = useState<BoardTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart({ active }: DragStartEvent) {
    const task = tasks.find((t) => t.id === active.id);
    setActiveTask(task ?? null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const overColumn = columns.find((c) => c.id === overId);
    const overTask = tasks.find((t) => t.id === overId);
    const targetStatus = (overColumn?.status ?? overTask?.status) as TaskStatusValue | undefined;

    const draggedTask = tasks.find((t) => t.id === activeId);
    if (!draggedTask || !targetStatus) return;

    if (draggedTask.status !== targetStatus) {
      onDrop(activeId, targetStatus);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <section
        aria-label="Kanban board"
        className="mt-2 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:gap-6"
      >
        {columns.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.status);
          return (
            <DroppableColumn
              key={column.id}
              column={column}
              tasks={columnTasks}
              assignee={assignee}
              isAdmin={isAdmin}
              currentUserId={currentUserId}
              isPending={isPending}
              activeViewersMap={activeViewersMap}
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
