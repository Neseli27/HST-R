import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { apiHandler, verifyAuth, requireRoles, jsonResponse, errorResponse } from "@/lib/api-utils";
import type { UserDoc, Role } from "@/types";

/**
 * POST /api/auth/create-staff
 * Personel hesabı oluştur (email+şifre ile Firebase Auth + Firestore)
 * Kullanılır: Hospital Admin (doktor oluşturur), Doktor (asistan/sekreter oluşturur)
 */
export const POST = apiHandler(async (req: NextRequest) => {
  const authUser = await verifyAuth(req);
  requireRoles(authUser, "HOSPITAL_ADMIN", "DOCTOR");

  const { email, password, phone, firstName, lastName, role, hospitalId, managedByDoctorId } =
    await req.json();

  if (!email || !password || !firstName || !lastName || !role) {
    return errorResponse("Zorunlu alanlar eksik");
  }

  // Firebase Auth'ta kullanıcı oluştur
  const firebaseUser = await adminAuth.createUser({
    email,
    password,
    phoneNumber: phone ? `+90${phone.replace(/^0/, "")}` : undefined,
    displayName: `${firstName} ${lastName}`,
  });

  // Custom claims ayarla
  await adminAuth.setCustomUserClaims(firebaseUser.uid, { role });

  // Firestore'a kaydet
  const userData: UserDoc = {
    uid: firebaseUser.uid,
    phone: phone || "",
    email,
    firstName,
    lastName,
    tcNo: null,
    gender: null,
    birthDate: null,
    role: role as Role,
    hospitalId: hospitalId || authUser!.hospitalId,
    managedByDoctorId: managedByDoctorId || authUser!.doctorId || null,
    avatarUrl: null,
    isActive: true,
    fcmTokens: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await adminDb.collection("users").doc(firebaseUser.uid).set(userData);

  return jsonResponse({ uid: firebaseUser.uid, ...userData }, 201);
});
