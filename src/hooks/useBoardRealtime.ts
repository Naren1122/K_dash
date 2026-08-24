"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { getSupabaseBrowserClient } from "@/lib/realtime/supabase-realtime";
import type {
  PresenceUser,
  RealtimeTaskMovedPayload,
  RealtimeTaskSavedPayload,
  RealtimeTaskDeletedPayload,
} from "@/types/realtime-types";
import type { RealtimeChannel } from "@supabase/supabase-js";

type UseBoardRealtimeProps = {
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  role: "ADMIN" | "MEMBER";
  activeTaskId?: string | null;
  onRemoteTaskMoved?: (payload: RealtimeTaskMovedPayload) => void;
  onRemoteTaskSaved?: (payload: RealtimeTaskSavedPayload) => void;
  onRemoteTaskDeleted?: (payload: RealtimeTaskDeletedPayload) => void;
};

export function useBoardRealtime({
  userId,
  userName,
  userEmail,
  role,
  activeTaskId,
  onRemoteTaskMoved,
  onRemoteTaskSaved,
  onRemoteTaskDeleted,
}: UseBoardRealtimeProps) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const displayName = userName || userEmail?.split("@")[0] || "Team Member";
  const displayEmail = userEmail || "";

  // Callbacks refs to avoid re-subscribing on function identity change
  const onRemoteTaskMovedRef = useRef(onRemoteTaskMoved);
  const onRemoteTaskSavedRef = useRef(onRemoteTaskSaved);
  const onRemoteTaskDeletedRef = useRef(onRemoteTaskDeleted);

  useEffect(() => {
    onRemoteTaskMovedRef.current = onRemoteTaskMoved;
    onRemoteTaskSavedRef.current = onRemoteTaskSaved;
    onRemoteTaskDeletedRef.current = onRemoteTaskDeleted;
  }, [onRemoteTaskMoved, onRemoteTaskSaved, onRemoteTaskDeleted]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    const channel = supabase.channel("kanban_board_main", {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channelRef.current = channel;

    // 1. Presence Sync
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<PresenceUser>();
      const users: PresenceUser[] = [];
      const seenIds = new Set<string>();

      for (const key of Object.keys(state)) {
        const presences = state[key];
        if (presences && presences.length > 0) {
          const user = presences[0];
          if (user && !seenIds.has(user.userId)) {
            seenIds.add(user.userId);
            users.push(user);
          }
        }
      }

      // Guard against infinite re-renders if presence state is identical
      setOnlineUsers((prev) => {
        const prevKey = prev.map((u) => `${u.userId}:${u.activeTaskId ?? ""}`).join("|");
        const nextKey = users.map((u) => `${u.userId}:${u.activeTaskId ?? ""}`).join("|");
        return prevKey === nextKey ? prev : users;
      });
    });

    // 2. Broadcast Listeners
    channel.on(
      "broadcast",
      { event: "task:moved" },
      ({ payload }: { payload: RealtimeTaskMovedPayload }) => {
        console.log("📡 [Realtime] Received task:moved:", payload);
        if (payload.actorId !== userId) {
          onRemoteTaskMovedRef.current?.(payload);
        }
      }
    );

    channel.on(
      "broadcast",
      { event: "task:saved" },
      ({ payload }: { payload: RealtimeTaskSavedPayload }) => {
        console.log("📡 [Realtime] Received task:saved:", payload);
        if (payload.actorId !== userId) {
          onRemoteTaskSavedRef.current?.(payload);
        }
      }
    );

    channel.on(
      "broadcast",
      { event: "task:deleted" },
      ({ payload }: { payload: RealtimeTaskDeletedPayload }) => {
        console.log("📡 [Realtime] Received task:deleted:", payload);
        if (payload.actorId !== userId) {
          onRemoteTaskDeletedRef.current?.(payload);
        }
      }
    );

    // 3. Subscribe & Track Initial Presence
    channel.subscribe(async (status) => {
      console.log("📡 [Realtime] Channel status:", status);
      if (status === "SUBSCRIBED") {
        setIsConnected(true);
        await channel.track({
          userId,
          userName: displayName,
          userEmail: displayEmail,
          role,
          activeTaskId: activeTaskId ?? null,
          onlineAt: new Date().toISOString(),
        });
      } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
        setIsConnected(false);
      }
    });

    return () => {
      setIsConnected(false);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId, displayName, displayEmail, role]);

  const prevActiveTaskIdRef = useRef(activeTaskId);

  // Update presence ONLY when activeTaskId truly changes
  useEffect(() => {
    if (channelRef.current && isConnected && prevActiveTaskIdRef.current !== activeTaskId) {
      prevActiveTaskIdRef.current = activeTaskId;
      channelRef.current.track({
        userId,
        userName: displayName,
        userEmail: displayEmail,
        role,
        activeTaskId: activeTaskId ?? null,
        onlineAt: new Date().toISOString(),
      });
    }
  }, [activeTaskId, isConnected, userId, displayName, displayEmail, role]);

  // Broadcast helper
  const broadcastTaskMoved = useCallback(
    (taskId: string, status: RealtimeTaskMovedPayload["status"]) => {
      console.log("📤 [Realtime] Sending broadcast task:moved:", { taskId, status, channel: !!channelRef.current });
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "task:moved",
          payload: {
            taskId,
            status,
            actorId: userId,
            actorName: displayName,
          },
        });
      }
    },
    [userId, displayName]
  );

  const broadcastTaskSaved = useCallback(
    (task: RealtimeTaskSavedPayload["task"], isNew = false) => {
      console.log("📤 [Realtime] Sending broadcast task:saved:", { taskId: task.id, title: task.title, isNew, channel: !!channelRef.current });
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "task:saved",
          payload: {
            task,
            actorId: userId,
            actorName: displayName,
            isNew,
          },
        });
      }
    },
    [userId, displayName]
  );

  const broadcastTaskDeleted = useCallback(
    (taskId: string) => {
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "task:deleted",
          payload: {
            taskId,
            actorId: userId,
            actorName: displayName,
          },
        });
      }
    },
    [userId, displayName]
  );

  // Memoized map of taskId -> viewer names (excluding self)
  const activeViewersMap: Record<string, string[]> = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const user of onlineUsers) {
      if (user.userId !== userId && user.activeTaskId) {
        if (!map[user.activeTaskId]) {
          map[user.activeTaskId] = [];
        }
        map[user.activeTaskId].push(user.userName);
      }
    }
    return map;
  }, [onlineUsers, userId]);

  return {
    onlineUsers,
    isConnected,
    activeViewersMap,
    broadcastTaskMoved,
    broadcastTaskSaved,
    broadcastTaskDeleted,
  };
}
