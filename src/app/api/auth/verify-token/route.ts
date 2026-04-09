export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { adminAuth, adminDb, DEMO_MODE } from "@/lib/firebase-admin";
import { apiHandler, jsonResponse, errorResponse } from "@/lib/api-utils";
import type { UserDoc } from "@/types";

/**
 * POST /api/auth/verify-token
 * Demo modda: { demoUserId: "demo-patient" }
 * Production'da: { idToken: "firebase-token" }
 */
export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json();

  if (DEMO_MODE && body.demoUserId) {
    const userDoc = await adminDb.collection("users").doc(body.demoUserId).get();
    if (!userDoc.exists) return errorResponse("Demo kullanıcı bulunamadı", 404);

    const user = userDoc.data();
    return jsonResponse({ user: { id: body.demoUserId, ...user }, isNewUser: false });
  }

  // Production Firebase Auth
  const { idToken } = body;
  if (!idToken) return errorResponse("Token gerekli");

  const decoded = await adminAuth.verifyIdToken(idToken);
  const userRef = adminDb.collection("users").doc(decoded.uid);
  const userDoc = await userRef.get();

  if (userDoc.exists) {
    const user = userDoc.data() as UserDoc;
    return jsonResponse({ user: { id: decoded.uid, ...user }, isNewUser: false });
  }

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
