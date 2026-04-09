"use client";

import { useEffect } from "react";
import { useQueue } from "@/hooks/useQueue";

const statusLabels: Record<string, { text: string; color: string }> = {
  WAITING: { text: "Bekliyor", color: "bg-yellow-100 text-yellow-800" },
  NOTIFIED: { text: "Sıranız Yaklaştı", color: "bg-orange-100 text-orange-800" },
  CALLED: { text: "Çağrıldınız!", color: "bg-green-100 text-green-800" },
  IN_ROOM: { text: "Muayenede", color: "bg-blue-100 text-blue-800" },
  PAUSED: { text: "Geçici Ayrılma", color: "bg-gray-100 text-gray-800" },
  RETURNED: { text: "Geri Döndü", color: "bg-purple-100 text-purple-800" },
  COMPLETED: { text: "Tamamlandı", color: "bg-green-100 text-green-800" },
};

export default function PatientQueuePage() {
  const { myQueue, lastNotification, fetchMyQueue } = useQueue();

  useEffect(() => {
    fetchMyQueue();
    const interval = setInterval(fetchMyQueue, 30000); // 30 saniyede bir yedek polling
    return () => clearInterval(interval);
  }, [fetchMyQueue]);

  if (!myQueue) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Aktif Sıranız Yok</h2>
          <p className="mt-2 text-gray-500">
            Randevunuz onaylandığında ve check-in yaptığınızda sıranızı burada takip edebilirsiniz.
          </p>
        </div>
      </div>
    );
  }

  const status = statusLabels[myQueue.status] || {
    text: myQueue.status,
    color: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {/* Bildirim Banner */}
      {lastNotification && (
        <div className="fixed left-0 right-0 top-0 z-50 bg-green-600 px-4 py-3 text-center text-white shadow-lg">
          {lastNotification}
        </div>
      )}

      <div className="w-full max-w-sm space-y-6">
        {/* Ticket Kodu */}
        <div className="rounded-2xl bg-white p-8 text-center shadow-xl">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Sıra Kodunuz
          </p>
          <p className="mt-2 text-5xl font-bold tracking-wider text-primary-700">
            {myQueue.displayCode}
          </p>
        </div>

        {/* Durum */}
        <div className="rounded-xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Durum</span>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${status.color}`}
            >
              {status.text}
            </span>
          </div>
        </div>

        {/* Sıra Bilgisi */}
        {myQueue.positionAhead > 0 && (
          <div className="rounded-xl bg-white p-6 shadow-md">
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">
                {myQueue.positionAhead}
              </p>
              <p className="mt-1 text-sm text-gray-500">kişi önünüzde</p>
              <p className="mt-2 text-xs text-gray-400">
                Tahmini bekleme: ~{myQueue.estimatedWaitMinutes} dakika
              </p>
            </div>
          </div>
        )}

        {myQueue.status === "CALLED" && (
          <div className="animate-pulse rounded-xl bg-green-600 p-6 text-center text-white shadow-lg">
            <p className="text-2xl font-bold">Sıranız Geldi!</p>
            <p className="mt-1">Lütfen muayene odasına gidin.</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-400">
          Sıranız otomatik güncellenir. Bu sayfayı açık tutun.
        </p>
      </div>
    </div>
  );
}
