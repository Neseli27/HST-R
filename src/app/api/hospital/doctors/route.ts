export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { apiHandler, verifyAuth, requireRoles, jsonResponse, errorResponse } from "@/lib/api-utils";
import type { UserDoc, DoctorDoc } from "@/types";

/**
 * GET /api/hospital/doctors — hastane doktorlarını listele
 * POST /api/hospital/doctors — doktor kaydet
 */
export const GET = apiHandler(async (req: NextRequest) => {
  const authUser = await verifyAuth(req);
  requireRoles(authUser, "HOSPITAL_ADMIN");

  const snapshot = await adminDb
    .collection("doctors")
    .where("hospitalId", "==", authUser!.hospitalId)
    .get();

  const doctors = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return jsonResponse(doctors);
});

export const POST = apiHandler(async (req: NextRequest) => {
  const authUser = await verifyAuth(req);
  requireRoles(authUser, "HOSPITAL_ADMIN");

  const { email, password, phone, firstName, lastName, title, specialization, departmentId, departmentName, roomNumber, dailyQuota, workingHours } = await req.json();

  if (!email || !password || !firstName || !lastName || !title || !departmentId) {
    return errorResponse("Zorunlu alanlar eksik");
  }

  // Firebase Auth kullanıcı oluştur
  const firebaseUser = await adminAuth.createUser({
    email,
    password,
    phoneNumber: phone ? `+90${phone.replace(/^0/, "")}` : undefined,
    displayName: `${title} ${firstName} ${lastName}`,
  });

  await adminAuth.setCustomUserClaims(firebaseUser.uid, { role: "DOCTOR" });

  const userRef = adminDb.collection("users").doc(firebaseUser.uid);
  const doctorRef = adminDb.collection("doctors").doc();

  const userData: UserDoc = {
    uid: firebaseUser.uid,
    phone: phone || "",
    email,
    firstName,
    lastName,
    tcNo: null,
    gender: null,
    birthDate: null,
    role: "DOCTOR",
    hospitalId: authUser!.hospitalId,
    managedByDoctorId: null,
    avatarUrl: null,
    isActive: true,
    fcmTokens: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const doctorData: DoctorDoc = {
    userId: firebaseUser.uid,
    hospitalId: authUser!.hospitalId!,
    departmentId,
    departmentName: departmentName || "",
    title,
    specialization: specialization || null,
    roomNumber: roomNumber || null,
    dailyQuota: dailyQuota || 30,
    workingHours: workingHours || {},
    isAvailable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const batch = adminDb.batch();
  batch.set(userRef, userData);
  batch.set(doctorRef, doctorData);
  await batch.commit();

  return jsonResponse({ id: doctorRef.id, ...doctorData }, 201);
});
