"use client";

import { useRouter } from "next/navigation";
import {
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  signOut,
  RecaptchaVerifier,
  ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/stores/auth.store";
import { useRef } from "react";

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout: storeLogout } = useAuthStore();
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  /**
   * Hasta: telefon numarasına SMS OTP gönder (Firebase Auth)
   */
  async function sendOtp(phone: string) {
    // Telefon numarasını E.164 formatına çevir
    let formatted = phone.replace(/\s/g, "");
    if (formatted.startsWith("0")) formatted = formatted.slice(1);
    if (!formatted.startsWith("+90")) formatted = "+90" + formatted;

    // reCAPTCHA verifier oluştur (invisible)
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }

    const confirmation = await signInWithPhoneNumber(
      auth,
      formatted,
      (window as any).recaptchaVerifier
    );
    confirmationRef.current = confirmation;
    return confirmation;
  }

  /**
   * Hasta: SMS OTP doğrula
   */
  async function verifyOtp(code: string) {
    if (!confirmationRef.current) {
      throw new Error("Önce OTP göndermelisiniz");
    }

    const result = await confirmationRef.current.confirm(code);
    // Firebase Auth otomatik olarak kullanıcıyı oturum açar
    // AuthProvider onAuthStateChanged ile yakalayacak

    // Yönlendirme AuthProvider'dan sonra yapılacak
    return result;
  }

  /**
   * Personel: email + şifre ile giriş (Firebase Auth)
   */
  async function staffLogin(email: string, password: string) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    // AuthProvider onAuthStateChanged ile yakalayacak ve role'e göre yönlendirecek
    return result;
  }

  /**
   * Çıkış
   */
  async function logout() {
    await signOut(auth);
    storeLogout();
    router.push("/");
  }

  /**
   * Role'e göre yönlendirme
   */
  function redirectByRole(role: string) {
    switch (role) {
      case "SUPERADMIN":
        router.push("/approvals");
        break;
      case "HOSPITAL_ADMIN":
        router.push("/hospitals");
        break;
      case "DOCTOR":
      case "ASSISTANT":
        router.push("/queue-management");
        break;
      case "SECRETARY":
        router.push("/check-in");
        break;
      case "PATIENT":
        router.push("/queue");
        break;
      default:
        router.push("/");
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    sendOtp,
    verifyOtp,
    staffLogin,
    logout,
    redirectByRole,
  };
}
