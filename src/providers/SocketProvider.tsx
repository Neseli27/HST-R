"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { useQueueStore } from "@/stores/queue.store";
import api from "@/lib/api";

/**
 * Sıra takip provider — Demo modda polling, production'da Firestore real-time
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const { setMyQueue, setLastNotification } = useQueueStore();
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.role !== "PATIENT") return;

    // Polling: her 5 saniyede sıra bilgisi güncelle
    async function pollQueue() {
      try {
        const res = await api.get("/api/queue/my");
        const data = res.data;

        if (!data) {
          setMyQueue(null);
          return;
        }

        setMyQueue({
          displayCode: data.displayCode,
          status: data.status,
          positionAhead: data.positionAhead,
          estimatedWaitMinutes: data.estimatedWaitMinutes,
        });

        // Durum değişikliği bildirimleri
        if (prevStatusRef.current && prevStatusRef.current !== data.status) {
          if (data.status === "CALLED") {
            setLastNotification(`Sıranız geldi! Kod: ${data.displayCode}`);
            if ("vibrate" in navigator) navigator.vibrate([200, 100, 200, 100, 200]);
            try { new Audio("/notification.mp3").play().catch(() => {}); } catch {}
          } else if (data.status === "NOTIFIED") {
            setLastNotification("Sıranız yaklaşıyor! Lütfen hazır olun.");
            if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
          }
        }
        prevStatusRef.current = data.status;
      } catch {
        // Henüz sırada değilse hata normal
      }
    }

    pollQueue();
    const interval = setInterval(pollQueue, 5000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user, setMyQueue, setLastNotification]);

  return <>{children}</>;
}
