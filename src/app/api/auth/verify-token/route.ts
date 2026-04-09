import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { apiHandler, jsonResponse, errorResponse } from "@/lib/api-utils";
import type { UserDoc } from "@/types";

/**
 * POST /api/auth/verify-token
 * Firebase Auth token doğrula, kullanıcı yoksa Firestore'da oluştur
 */
export const POST = apiHandler(async (req: NextRequest) => {
  const { idToken } = await req.json();
  if (!idToken) return errorResponse("Token gerekli");

  const decoded = await adminAuth.verifyIdToken(idToken);
  const userRef = adminDb.collection("users").doc(decoded.uid);
  const userDoc = await userRef.get();

  if (userDoc.exists) {
    // Mevcut kullanıcı
    const user = userDoc.data() as UserDoc;
    return jsonResponse({ user: { id: decoded.uid, ...user }, isNewUser: false });
  }

  // Yeni kullanıcı — telefon ile giriş yaptıysa
  const newUser: UserDoc = {
    uid: decoded.uid,
    phone: decoded.phone_number || "",
    email: decoded.email || null,
    firstName: "",
    lastName: "",
    tcNo: null,
    gender: null,
    birthDate: null,
    role: "PATIENT",
    hospitalId: null,
    managedByDoctorId: null,
    avatarUrl: null,
    isActive: true,
    fcmTokens: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await userRef.set(newUser);
  return jsonResponse({ user: { id: decoded.uid, ...newUser }, isNewUser: true });
});
