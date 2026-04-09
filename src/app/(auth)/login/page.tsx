"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";

const DEMO_USERS = [
  { id: "demo-patient", label: "Hasta", desc: "Ali Veli", icon: "🏥", color: "bg-blue-600 hover:bg-blue-700", redirect: "/queue" },
  { id: "demo-assistant", label: "Asistan", desc: "Ayşe Kaya", icon: "👩‍⚕️", color: "bg-green-600 hover:bg-green-700", redirect: "/queue-management" },
  { id: "demo-secretary", label: "Sekreter", desc: "Fatma Çelik", icon: "🗂️", color: "bg-yellow-600 hover:bg-yellow-700", redirect: "/check-in" },
  { id: "demo-doctor", label: "Doktor", desc: "Uzm. Dr. Mehmet Demir", icon: "🩺", color: "bg-purple-600 hover:bg-purple-700", redirect: "/queue-management" },
  { id: "demo-hospital-admin", label: "Hastane Yönetimi", desc: "Ahmet Yıldız", icon: "🏢", color: "bg-indigo-600 hover:bg-indigo-700", redirect: "/approvals" },
  { id: "demo-superadmin", label: "Süper Admin", desc: "Platform Yöneticisi", icon: "⚙️", color: "bg-red-600 hover:bg-red-700", redirect: "/approvals" },
];

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleDemoLogin(userId: string, redirect: string) {
    setLoading(userId);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoUserId: userId }),
      });
      const data = await res.json();

      if (data.success && data.data?.user) {
        localStorage.setItem("demoUserId", userId);
        setUser({
          uid: data.data.user.id,
          phone: data.data.user.phone,
          email: data.data.user.email,
          firstName: data.data.user.firstName,
          lastName: data.data.user.lastName,
          role: data.data.user.role,
          hospitalId: data.data.user.hospitalId,
        });
        router.push(redirect);
      } else {
        setError(data.error || "Giriş başarısız");
      }
    } catch (err: any) {
      setError(err.message || "Bağlantı hatası");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-700">HST-R</h1>
          <p className="mt-1 text-gray-500">Demo Giriş</p>
          <p className="mt-1 text-xs text-amber-600 bg-amber-50 rounded-lg p-2">
            Test modu aktif — bir rol seçerek giriş yapın
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {DEMO_USERS.map((user) => (
            <button
              key={user.id}
              onClick={() => handleDemoLogin(user.id, user.redirect)}
              disabled={loading !== null}
              className={`w-full flex items-center gap-4 rounded-xl px-5 py-4 text-white shadow-md transition ${user.color} disabled:opacity-50`}
            >
              <span className="text-2xl">{user.icon}</span>
              <div className="text-left flex-1">
                <div className="font-semibold">{user.label}</div>
                <div className="text-sm opacity-80">{user.desc}</div>
              </div>
              {loading === user.id && (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
