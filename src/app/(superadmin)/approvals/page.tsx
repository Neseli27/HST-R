"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Hospital {
  id: string;
  name: string;
  city: string;
  district: string;
  phone: string;
  email: string;
  status: string;
  createdAt: string;
  _count: { doctors: number };
}

export default function ApprovalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);

  async function fetchHospitals() {
    setLoading(true);
    try {
      const { data } = await api.get(`/superadmin/hospitals?status=${filter}`);
      setHospitals(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHospitals();
  }, [filter]);

  async function handleAction(id: string, action: "approve" | "reject" | "suspend") {
    try {
      await api.patch(`/superadmin/hospitals/${id}/${action}`);
      fetchHospitals();
    } catch (err: any) {
      alert(err.response?.data?.error || "İşlem başarısız");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Hastane Onayları</h1>

      {/* Filtreler */}
      <div className="mb-6 flex gap-2">
        {["PENDING", "APPROVED", "REJECTED", "SUSPENDED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filter === s
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "PENDING"
              ? "Bekleyen"
              : s === "APPROVED"
              ? "Onaylı"
              : s === "REJECTED"
              ? "Reddedilen"
              : "Askıya Alınan"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">Yükleniyor...</p>
      ) : hospitals.length === 0 ? (
        <p className="text-gray-500">Bu durumda hastane yok.</p>
      ) : (
        <div className="space-y-4">
          {hospitals.map((h) => (
            <div
              key={h.id}
              className="rounded-xl border bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {h.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {h.city}/{h.district} — {h.phone}
                  </p>
                  <p className="text-sm text-gray-500">{h.email}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Kayıt: {new Date(h.createdAt).toLocaleDateString("tr-TR")} — Doktor: {h._count.doctors}
                  </p>
                </div>
                <div className="flex gap-2">
                  {h.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleAction(h.id, "approve")}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                      >
                        Onayla
                      </button>
                      <button
                        onClick={() => handleAction(h.id, "reject")}
                        className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                      >
                        Reddet
                      </button>
                    </>
                  )}
                  {h.status === "APPROVED" && (
                    <button
                      onClick={() => handleAction(h.id, "suspend")}
                      className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600"
                    >
                      Askıya Al
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
