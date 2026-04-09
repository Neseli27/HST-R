"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // Demo mode: localStorage'dan kullanıcı bilgisini al
    const demoUserId = localStorage.getItem("demoUserId");
    if (demoUserId) {
      fetch("/api/auth/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoUserId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.user) {
            setUser({
              uid: data.data.user.id,
              phone: data.data.user.phone,
              email: data.data.user.email,
              firstName: data.data.user.firstName,
              lastName: data.data.user.lastName,
              role: data.data.user.role,
              hospitalId: data.data.user.hospitalId,
            });
          } else {
            localStorage.removeItem("demoUserId");
            setUser(null);
          }
        })
        .catch(() => {
          setUser(null);
        });
    } else {
      setLoading(false);
    }
  }, [setUser, setLoading]);

  return <>{children}</>;
}
