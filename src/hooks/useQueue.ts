"use client";

import { useCallback } from "react";
import { useQueueStore } from "@/stores/queue.store";
import api from "@/lib/api";

export function useQueue() {
  const { myQueue, entries, lastNotification, setMyQueue, setEntries } =
    useQueueStore();

  const fetchMyQueue = useCallback(async () => {
    try {
      const res = await api.get("/api/queue/my");
      setMyQueue(res.data);
    } catch {
      setMyQueue(null);
    }
  }, [setMyQueue]);

  const fetchTodayQueue = useCallback(async () => {
    try {
      const res = await api.get("/api/queue/today");
      setEntries(res.data?.entries || []);
      return res.data;
    } catch {
      return null;
    }
  }, [setEntries]);

  const callNext = useCallback(async () => {
    const res = await api.post("/api/queue/call-next");
    return res.data;
  }, []);

  const pauseEntry = useCallback(async (entryId: string) => {
    const res = await api.patch(`/api/queue/${entryId}/pause`);
    return res.data;
  }, []);

  const returnEntry = useCallback(async (entryId: string) => {
    const res = await api.patch(`/api/queue/${entryId}/return`);
    return res.data;
  }, []);

  const completeEntry = useCallback(async (entryId: string) => {
    const res = await api.patch(`/api/queue/${entryId}/complete`);
    return res.data;
  }, []);

  const skipEntry = useCallback(async (entryId: string) => {
    const res = await api.patch(`/api/queue/${entryId}/skip`);
    return res.data;
  }, []);

  return {
    myQueue,
    entries,
    lastNotification,
    fetchMyQueue,
    fetchTodayQueue,
    callNext,
    pauseEntry,
    returnEntry,
    completeEntry,
    skipEntry,
  };
}
