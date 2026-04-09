"use client";

import { useEffect, useState } from "react";
import { useQueue } from "@/hooks/useQueue";
import { useSocket } from "@/hooks/useSocket";

const statusColors: Record<string, string> = {
  WAITING: "bg-yellow-50 border-yellow-200",
  NOTIFIED: "bg-orange-50 border-orange-200",
  CALLED: "bg-green-50 border-green-200",
  IN_ROOM: "bg-blue-50 border-blue-200",
  PAUSED: "bg-gray-50 border-gray-300 opacity-60",
  RETURNED: "bg-purple-50 border-purple-200",
  COMPLETED: "bg-green-50 border-green-200 opacity-40",
  SKIPPED: "bg-red-50 border-red-200 opacity-40",
};

const statusLabels: Record<string, string> = {
  WAITING: "Bekliyor",
  NOTIFIED: "Bilgilendirildi",
  CALLED: "Çağrıldı",
  IN_ROOM: "Odada",
  PAUSED: "Geçici Ayrıldı",
  RETURNED: "Geri Döndü",
  COMPLETED: "Tamamlandı",
  SKIPPED: "Atlandı",
};

export default function QueueManagementPage() {
  const {
    entries,
    fetchTodayQueue,
    callNext,
    pauseEntry,
    returnEntry,
    completeEntry,
    skipEntry,
  } = useQueue();
  const [loading, setLoading] = useState("");

  useEffect(() => {
    fetchTodayQueue();
  }, [fetchTodayQueue]);

  async function handleAction(
    action: (id: string) => Promise<any>,
    entryId: string,
    label: string
  ) {
    setLoading(`${label}:${entryId}`);
    try {
      await action(entryId);
      await fetchTodayQueue();
    } catch (err: any) {
      alert(err.response?.data?.error || "İşlem başarısız");
    } finally {
      setLoading("");
    }
  }

  const activeEntries = entries.filter(
    (e) => !["COMPLETED", "SKIPPED"].includes(e.status)
  );
  const completedEntries = entries.filter((e) =>
    ["COMPLETED", "SKIPPED"].includes(e.status)
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sıra Yönetimi</h1>
        <button
          onClick={async () => {
            setLoading("call-next");
            try {
              await callNext();
              await fetchTodayQueue();
            } catch (err: any) {
              alert(err.response?.data?.error || "Sırada bekleyen yok");
            } finally {
              setLoading("");
            }
          }}
          disabled={loading === "call-next"}
          className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white shadow transition hover:bg-green-700 disabled:opacity-50"
        >
          {loading === "call-next" ? "..." : "Sonraki Hastayı Çağır"}
        </button>
      </div>

      {/* Aktif Sıra */}
      <div className="space-y-3">
        {activeEntries.map((entry) => (
          <div
            key={entry.id}
            className={`rounded-xl border-2 p-4 ${statusColors[entry.status] || "bg-white"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-700">
                    #{entry.orderNumber}
                  </span>
                  <span className="font-medium text-gray-900">
                    {entry.patientName}
                  </span>
                  <span className="text-sm text-gray-500">
                    {entry.displayCode}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <span>Saat: {entry.appointmentTime}</span>
                  <span className="rounded bg-gray-200 px-2 py-0.5 text-xs">
                    {statusLabels[entry.status]}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                {entry.status === "IN_ROOM" && (
                  <>
                    <button
                      onClick={() =>
                        handleAction(pauseEntry, entry.id, "pause")
                      }
                      disabled={loading === `pause:${entry.id}`}
                      className="rounded-lg bg-yellow-500 px-3 py-2 text-xs font-medium text-white hover:bg-yellow-600"
                    >
                      Geçici Ayrıl
                    </button>
                    <button
                      onClick={() =>
                        handleAction(completeEntry, entry.id, "complete")
                      }
                      disabled={loading === `complete:${entry.id}`}
                      className="rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700"
                    >
                      Tamamla
                    </button>
                  </>
                )}
                {entry.status === "PAUSED" && (
                  <button
                    onClick={() =>
                      handleAction(returnEntry, entry.id, "return")
                    }
                    disabled={loading === `return:${entry.id}`}
                    className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-medium text-white hover:bg-purple-700"
                  >
                    Geri Döndü
                  </button>
                )}
                {["WAITING", "RETURNED"].includes(entry.status) && (
                  <button
                    onClick={() => handleAction(skipEntry, entry.id, "skip")}
                    disabled={loading === `skip:${entry.id}`}
                    className="rounded-lg bg-red-500 px-3 py-2 text-xs font-medium text-white hover:bg-red-600"
                  >
                    Atla
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {activeEntries.length === 0 && (
          <p className="py-8 text-center text-gray-500">
            Bugün sırada bekleyen hasta yok.
          </p>
        )}
      </div>

      {/* Tamamlanan */}
      {completedEntries.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-gray-600">
            Tamamlanan ({completedEntries.length})
          </h2>
          <div className="space-y-2">
            {completedEntries.map((entry) => (
              <div
                key={entry.id}
                className={`rounded-lg border p-3 ${statusColors[entry.status]}`}
              >
                <span className="text-sm text-gray-500">
                  #{entry.orderNumber} — {entry.patientName} — {entry.displayCode} —{" "}
                  {statusLabels[entry.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
