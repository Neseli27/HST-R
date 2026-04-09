"use client";

import { useState } from "react";
import QRScanner from "@/components/qr/QRScanner";
import api from "@/lib/api";

export default function CheckInPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"qr" | "manual">("qr");

  async function handleQrScan(data: string) {
    setError("");
    setLoading(true);
    try {
      // QR URL'den appointmentId ve token parse et
      const url = new URL(data);
      const parts = url.pathname.split("/");
      const appointmentId = parts[parts.length - 1];
      const token = url.searchParams.get("token");

      if (!appointmentId || !token) {
        setError("Geçersiz QR kodu");
        return;
      }

      const { data: response } = await api.post("/secretary/check-in", {
        appointmentId,
        token,
      });
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Check-in başarısız");
    } finally {
      setLoading(false);
    }
  }

  async function handleManualCheckIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data: response } = await api.post("/secretary/check-in/manual", {
        ticketCode: manualCode,
      });
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Check-in başarısız");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Hasta Check-in</h1>

      {/* Tab geçişi */}
      <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setMode("qr")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
            mode === "qr"
              ? "bg-white text-primary-700 shadow"
              : "text-gray-500"
          }`}
        >
          QR Kod
        </button>
        <button
          onClick={() => setMode("manual")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
            mode === "manual"
              ? "bg-white text-primary-700 shadow"
              : "text-gray-500"
          }`}
        >
          Manuel Kod
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {result ? (
        <div className="space-y-4 rounded-xl bg-green-50 p-6">
          <div className="text-center">
            <p className="text-lg font-bold text-green-700">Check-in Başarılı!</p>
            <p className="mt-2 text-3xl font-bold tracking-wider text-green-800">
              {result.ticketCode}
            </p>
            <p className="mt-1 text-sm text-green-600">
              Hasta sıraya eklendi.
            </p>
          </div>
          <button
            onClick={() => {
              setResult(null);
              setManualCode("");
              setError("");
            }}
            className="w-full rounded-lg bg-primary-600 px-4 py-3 font-semibold text-white"
          >
            Yeni Check-in
          </button>
        </div>
      ) : mode === "qr" ? (
        <QRScanner onScan={handleQrScan} onError={setError} />
      ) : (
        <form onSubmit={handleManualCheckIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Randevu Kodu
            </label>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-xl tracking-wider focus:border-primary-500 focus:outline-none"
              placeholder="123-456"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? "İşleniyor..." : "Check-in Yap"}
          </button>
        </form>
      )}
    </div>
  );
}
