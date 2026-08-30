"use client";

import { useEffect, useState } from "react";
import { getActivityLogsAction } from "@/lib/actions/activity";

type ActivityLogItem = {
  id: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date | string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

export function ActivityFeed({ taskId }: { taskId: string }) {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getActivityLogsAction(taskId)
      .then((res) => {
        if (isMounted && res.logs) {
          setLogs(res.logs);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.message || "Failed to load activity logs");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [taskId]);

  if (loading) {
    return (
      <div className="py-6 text-center text-xs text-slate-400">
        Loading activity...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 text-center text-xs text-rose-500 dark:text-rose-400">
        {error}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-400">
        No activity logged for this task yet.
      </div>
    );
  }

  function formatActionText(log: ActivityLogItem) {
    const name = log.user.name || log.user.email;
    switch (log.action) {
      case "CREATED":
        return `${name} created this task`;
      case "UPDATED_STATUS":
        return `${name} changed status from ${log.oldValue || "TODO"} to ${log.newValue}`;
      case "REASSIGNED":
        return `${name} reassigned this task`;
      case "COMMENTED":
        return `${name} added a comment`;
      case "UPDATED_DETAILS":
        return `${name} updated task details (${log.field || "fields"})`;
      default:
        return `${name} performed ${log.action.toLowerCase()}`;
    }
  }

  return (
    <div className="mt-3 space-y-3">
      {logs.map((log) => {
        const timeStr = new Date(log.createdAt).toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div key={log.id} className="flex items-start gap-2.5 text-xs text-slate-600">
            <div className="mt-1 h-2 w-2 rounded-full bg-sky-400 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-slate-800">{formatActionText(log)}</p>
              <p className="text-[10px] text-slate-400">{timeStr}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
