import { create } from "zustand";
import type { QueueEntryStatus } from "@/types";

interface QueueInfo {
  displayCode: string;
  status: QueueEntryStatus;
  positionAhead: number;
  estimatedWaitMinutes: number;
}

interface QueueEntryInfo {
  id: string;
  orderNumber: number;
  displayCode: string;
  patientName: string;
  status: QueueEntryStatus;
  appointmentTime: string;
}

interface QueueState {
  myQueue: QueueInfo | null;
  setMyQueue: (queue: QueueInfo | null) => void;
  entries: QueueEntryInfo[];
  setEntries: (entries: QueueEntryInfo[]) => void;
  lastNotification: string | null;
  setLastNotification: (msg: string | null) => void;
}

export const useQueueStore = create<QueueState>((set) => ({
  myQueue: null,
  setMyQueue: (myQueue) => set({ myQueue }),
  entries: [],
  setEntries: (entries) => set({ entries }),
  lastNotification: null,
  setLastNotification: (lastNotification) => set({ lastNotification }),
}));
