"use client";

import { useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/stores/auth.store";
import { useQueueStore } from "@/stores/queue.store";

/**
 * Firestore real-time listener provider
 * Socket.io yerine Firestore onSnapshot kullanır
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const { setMyQueue, setLastNotification } = useQueueStore();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const unsubscribers: (() => void)[] = [];

    if (user.role === "PATIENT") {
      // Hasta: kendi aktif sıra kaydını real-time dinle
      const activeStatuses = ["WAITING", "NOTIFIED", "CALLED", "IN_ROOM", "RETURNED"];
      const q = query(
        collection(db, "queueEntries"),
        where("patientId", "==", user.uid),
        where("status", "in", activeStatuses)
      );

      const unsub = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
          setMyQueue(null);
          return;
        }

        const entry = snapshot.docs[0].data();
        const previousStatus = useQueueStore.getState().myQueue?.status;

        setMyQueue({
          displayCode: entry.displayCode,
          status: entry.status,
          positionAhead: 0, // Ayrıca API'den polling ile güncellenecek
          estimatedWaitMinutes: 0,
        });

        // Durum değişikliği bildirimleri
        if (previousStatus && previousStatus !== entry.status) {
          if (entry.status === "CALLED") {
            setLastNotification(`Sıranız geldi! Kod: ${entry.displayCode}`);
            // Titreşim
            if ("vibrate" in navigator) {
              navigator.vibrate([200, 100, 200, 100, 200]);
            }
            // Ses
            try {
              new Audio("/notification.mp3").play().catch(() => {});
            } catch {}
          } else if (entry.status === "NOTIFIED") {
            setLastNotification("Sıranız yaklaşıyor! Lütfen hazır olun.");
            if ("vibrate" in navigator) {
              navigator.vibrate([100, 50, 100]);
            }
          }
        }
      });

      unsubscribers.push(unsub);
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [isAuthenticated, user, setMyQueue, setLastNotification]);

  return <>{children}</>;
}
