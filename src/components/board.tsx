"use client";

import Image from "next/image";
import { FormEvent, useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

import { createTask, deleteTask, reassignTask, updateTaskStatus } from "@/app/actions/tasks";
import { useToast } from "@/components/toast-provider";
import { ConfirmDialog } from "@/components/confirm-dialog";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type Assignee = { id: string; name: string | null; email: string };
type BoardTask = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  assignee: Assignee | null;
};

type BoardProps = { assignee: Assignee[]; tasks: BoardTask[]; role: "ADMIN" | "MEMBER"; userId: string; userName: string };

const columns: Array<{ status: TaskStatus; label: string; accent: string; soft: string; border: string; subtitle: string }> = [
  { status: "TODO", label: "To do", subtitle: "Ready when you are", accent: "bg-sky-500", soft: "bg-sky-50", border: "border-sky-100" },
  { status: "IN_PROGRESS", label: "In progress", subtitle: "Work in motion", accent: "bg-amber-500", soft: "bg-amber-50", border: "border-amber-100" },
  { status: "DONE", label: "Done", subtitle: "Ready to celebrate", accent: "bg-emerald-500", soft: "bg-emerald-50", border: "border-emerald-100" },
];

const statusLabels: Record<TaskStatus, string> = { TODO: "To do", IN_PROGRESS: "In progress", DONE: "Done" };

function actionErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export function Board({ assignee, tasks, role, userId, userName }: BoardProps) {
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { showToast } = useToast();
  const isAdmin = role === "ADMIN";
  const myTasks = tasks.filter((task) => task.assignee?.id === userId).length;

  function runAction(action: () => Promise<unknown>, onSuccess?: () => void) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        onSuccess?.();
      } catch (caughtError) {
        setError(actionErrorMessage(caughtError));
      }
    });
  }

  function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    runAction(
      () => createTask({ title: formData.get("title"), description: formData.get("description"), assigneeId: formData.get("assigneeId") }),
      () => { form.reset(); setShowCreateForm(false); showToast("Task created successfully!", "success"); },
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f7fb] px-3 py-3 text-slate-900 sm:px-6 sm:py-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-amber-100/60 blur-3xl" />
      </div>

      <div className="mx-auto max-w-[1480px]">
        <header className="overflow-hidden rounded-[1.75rem] bg-slate-950 shadow-[0_22px_55px_-24px_rgba(15,23,42,0.65)]">
          <div className="relative px-5 py-5 sm:px-7 sm:py-6 lg:px-9">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[22px] border-sky-400/10" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-lg shadow-sky-950/30 sm:h-[4.5rem] sm:w-[4.5rem]">
                  <Image alt="Kanban logo" className="h-full w-full object-contain" height={72} priority src="/Screenshot 2026-07-23 143649.png" width={72} />
                </div>
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-sky-300">Your workspace</p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">Kanban Task Board</h1>
                  <p className="mt-1 text-sm text-slate-300">A focused place for work that moves forward.</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-2 pl-3 backdrop-blur sm:justify-end">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-300 to-indigo-400 text-xs font-black text-slate-950">{initials(userName)}</span>
                  <div className="min-w-0">
                    <p className="max-w-32 truncate text-sm font-semibold text-white sm:max-w-48">{userName}</p>
                    <p className="text-xs text-slate-300">{isAdmin ? "Administrator" : "Member"}</p>
                  </div>
                </div>
                <button className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white" onClick={() => { showToast("Signing out... 👋", "info"); setTimeout(() => signOut({ callbackUrl: "/login?message=signed_out" }), 800); }} type="button">Sign out</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 border-t border-white/10 bg-white/[0.035] px-3 py-3 sm:px-6 lg:px-9">
            <div className="border-r border-white/10 px-3 sm:px-5"><p className="text-lg font-bold text-white sm:text-2xl">{tasks.length}</p><p className="mt-0.5 text-[0.62rem] font-semibold uppercase tracking-wider text-slate-400 sm:text-xs">Total tasks</p></div>
            <div className="border-r border-white/10 px-3 sm:px-5"><p className="text-lg font-bold text-white sm:text-2xl">{tasks.filter((task) => task.status === "IN_PROGRESS").length}</p><p className="mt-0.5 text-[0.62rem] font-semibold uppercase tracking-wider text-slate-400 sm:text-xs">In progress</p></div>
            <div className="px-3 sm:px-5"><p className="text-lg font-bold text-white sm:text-2xl">{isAdmin ? tasks.filter((task) => task.status === "DONE").length : myTasks}</p><p className="mt-0.5 text-[0.62rem] font-semibold uppercase tracking-wider text-slate-400 sm:text-xs">{isAdmin ? "Completed" : "Assigned to you"}</p></div>
          </div>
        </header>

        <div className="mt-6 flex flex-col gap-4 sm:mt-8 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-xl font-bold tracking-tight text-slate-900">Your board</h2><p className="mt-1 text-sm text-slate-500">{isAdmin ? "Create, assign, and guide every piece of work." : "Update the work assigned to you as it progresses."}</p></div>
          {isAdmin ? <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300" onClick={() => setShowCreateForm((visible) => !visible)} type="button"><span className="text-lg leading-none">+</span>{showCreateForm ? "Close form" : "Create task"}</button> : null}
        </div>

        {error ? <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm" role="alert">{error}</p> : null}

        {isAdmin && showCreateForm ? (
          <form className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_35px_-20px_rgba(15,23,42,0.3)] md:grid-cols-2 md:p-6" onSubmit={handleCreateTask}>
            <div className="md:col-span-2"><p className="text-base font-bold text-slate-900">Create a new task</p><p className="mt-1 text-sm text-slate-500">Keep it clear, concise, and assign it to a team member when ready.</p></div>
            <label className="text-sm font-semibold text-slate-700">Task title<input className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" maxLength={200} name="title" placeholder="e.g. Review onboarding flow" required /></label>
            <label className="text-sm font-semibold text-slate-700">Assign to<select className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" defaultValue="" name="assigneeId"><option value="">Leave unassigned</option>{assignee.map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.name ?? assignee.email}</option>)}</select></label>
            <label className="text-sm font-semibold text-slate-700 md:col-span-2">Description<textarea className="mt-2 min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" maxLength={2000} name="description" placeholder="Add useful context, expected outcome, or dependencies..." /></label>
            <div className="flex justify-end md:col-span-2"><button className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60" disabled={isPending} type="submit">{isPending ? "Creating..." : "Create task"}</button></div>
          </form>
        ) : null}

        <section aria-label="Kanban board" className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
          {columns.map((column) => {
            const columnTasks = tasks.filter((task) => task.status === column.status);
            return (
              <section className={`rounded-2xl border ${column.border} ${column.soft} p-3.5 sm:p-4`} key={column.status}>
                <div className="mb-4 flex items-center justify-between px-1"><div><h2 className="flex items-center gap-2.5 text-base font-bold text-slate-800"><span className={`h-2.5 w-2.5 rounded-full ${column.accent} ring-4 ring-white/70`} />{column.label}</h2><p className="mt-1 text-xs text-slate-500">{column.subtitle}</p></div><span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-2 text-xs font-bold text-slate-600 shadow-sm">{columnTasks.length}</span></div>
                <div className="space-y-3">
                  {columnTasks.map((task) => {
                    const canUpdateStatus = isAdmin || task.assignee?.id === userId;
                    return (
                      <article className="group rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.35)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_-18px_rgba(15,23,42,0.35)]" key={task.id}>
                        <h3 className="text-[0.95rem] font-bold leading-5 text-slate-800">{task.title}</h3>
                        {task.description ? <p className="mt-2 line-clamp-3 text-sm leading-5 text-slate-500">{task.description}</p> : <p className="mt-2 text-sm italic text-slate-400">No description added.</p>}
                        <div className="mt-4 grid gap-3 border-t border-slate-100 pt-3">
                          <label className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-500">Status<select aria-label={`Status for ${task.title}`} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-3 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60" defaultValue={task.status} disabled={!canUpdateStatus || isPending} onChange={(event) => runAction(() => updateTaskStatus({ taskId: task.id, status: event.target.value }))}>{columns.map((option) => <option key={option.status} value={option.status}>{statusLabels[option.status]}</option>)}</select></label>
                          {isAdmin ? <label className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-500">Assignee<select aria-label={`Assignee for ${task.title}`} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-3 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60" defaultValue={task.assignee?.id ?? ""} disabled={isPending} onChange={(event) => runAction(() => reassignTask({ taskId: task.id, assigneeId: event.target.value }))}><option value="">Unassigned</option>{assignee.map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.name ?? assignee.email}</option>)}</select></label> : <div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[0.65rem] font-black text-slate-500">{task.assignee ? initials(task.assignee.name ?? task.assignee.email) : "--"}</span><p className="min-w-0 truncate text-xs font-medium text-slate-500">{task.assignee ? task.assignee.name ?? task.assignee.email : "Unassigned"}</p></div>}
                        </div>
                        <div className="mt-4 flex min-h-7 items-center justify-between gap-2"><span>{role === "MEMBER" && task.assignee?.id === userId ? <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[0.68rem] font-bold text-indigo-700">Assigned to you</span> : null}</span>{isAdmin ? <button className="rounded-lg px-2 py-1 text-xs font-bold text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-60" disabled={isPending} onClick={() => setDeletingTaskId(task.id)} type="button">Delete</button> : null}</div>
                      </article>
                    );
                  })}
                  {columnTasks.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300/80 bg-white/50 px-4 py-10 text-center text-sm font-medium text-slate-400">No tasks here yet.</p> : null}
                </div>
              </section>
            );
          })}
        </section>

        {/* Confirm delete dialog */}
        {deletingTaskId ? (
          <ConfirmDialog
            taskTitle={tasks.find((t) => t.id === deletingTaskId)?.title ?? "this task"}
            onConfirm={() => {
              const taskId = deletingTaskId;
              setDeletingTaskId(null);
              runAction(() => deleteTask(taskId), () => showToast("Task deleted successfully!", "success"));
            }}
            onCancel={() => setDeletingTaskId(null)}
          />
        ) : null}
      </div>
    </main>
  );
}
