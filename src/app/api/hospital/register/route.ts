import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { apiHandler, jsonResponse, errorResponse, slugify } from "@/lib/api-utils";
import { v4 as uuidv4 } from "crypto";
import type { HospitalDoc, UserDoc } from "@/types";

/**
 * POST /api/hospital/register
 * Hastane kaydı — public endpoint
 */
export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { name, address, city, district, phone, email, taxNumber, adminEmail, adminPassword, adminFirstName, adminLastName } = body;

  if (!name || !email || !taxNumber || !adminEmail || !adminPassword) {
    return errorResponse("Zorunlu alanlar eksik");
  }

  // Email benzersizlik kontrolü
  const existing = await adminDb
    .collection("hospitals")
    .where("taxNumber", "==", taxNumber)
    .limit(1)
    .get();

  if (!existing.empty) {
    return errorResponse("Bu vergi numarası ile kayıtlı hastane var", 409);
  }

  // Firebase Auth'ta admin kullanıcı oluştur
  const firebaseUser = await adminAuth.createUser({
    email: adminEmail,
    password: adminPassword,
    displayName: `${adminFirstName} ${adminLastName}`,
  });

  await adminAuth.setCustomUserClaims(firebaseUser.uid, { role: "HOSPITAL_ADMIN" });

  // Firestore transaction: hastane + admin
  const hospitalRef = adminDb.collection("hospitals").doc();
  const userRef = adminDb.collection("users").doc(firebaseUser.uid);

  const hospitalData: HospitalDoc = {
    name,
    slug: slugify(name),
    address,
    city,
    district,
    phone,
    email,
    taxNumber,
    status: "PENDING",
    logoUrl: null,
    qrToken: crypto.randomUUID(),
    approvedAt: null,
    approvedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const userData: UserDoc = {
    uid: firebaseUser.uid,
    phone: phone || "",
    email: adminEmail,
    firstName: adminFirstName,
    lastName: adminLastName,
    tcNo: null,
    gender: null,
    birthDate: null,
    role: "HOSPITAL_ADMIN",
    hospitalId: hospitalRef.id,
    managedByDoctorId: null,
    avatarUrl: null,
    isActive: true,
    fcmTokens: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const batch = adminDb.batch();
  batch.set(hospitalRef, hospitalData);
  batch.set(userRef, userData);
  await batch.commit();

  return jsonResponse(
    {
      hospital: { id: hospitalRef.id, ...hospitalData },
      message: "Hastane kaydınız alındı. Onay bekleniyor.",
    },
    201
  );
});
