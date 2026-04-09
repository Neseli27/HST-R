"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, setUser, logout: storeLogout } = useAuthStore();

  async function demoLogin(userId: string) {
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
      return data.data.user;
    }
    throw new Error(data.error || "Giriş başarısız");
  }

  function logout() {
    localStorage.removeItem("demoUserId");
    storeLogout();
    router.push("/");
  }

  function redirectByRole(role: string) {
    switch (role) {
      case "SUPERADMIN": router.push("/approvals"); break;
      case "HOSPITAL_ADMIN": router.push("/approvals"); break;
      case "DOCTOR":
      case "ASSISTANT": router.push("/queue-management"); break;
      case "SECRETARY": router.push("/check-in"); break;
      case "PATIENT": router.push("/queue"); break;
      default: router.push("/");
    }
  }

  return { user, isAuthenticated, isLoading, demoLogin, logout, redirectByRole };
}
