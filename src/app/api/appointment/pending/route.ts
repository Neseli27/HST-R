export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { apiHandler, verifyAuth, requireRoles, jsonResponse } from "@/lib/api-utils";

/**
 * GET /api/appointment/pending — asistan: bekleyen randevu talepleri
 */
export const GET = apiHandler(async (req: NextRequest) => {
  const authUser = await verifyAuth(req);
  requireRoles(authUser, "ASSISTANT");

  const doctorId = authUser!.managedByDoctorId;
  if (!doctorId) {
    // Doktor ID'sini bul
    const userDoc = await adminDb.collection("users").doc(authUser!.uid).get();
    const managedByDoctorId = userDoc.data()?.managedByDoctorId;
    if (!managedByDoctorId) return jsonResponse([]);
  }

  const snapshot = await adminDb
    .collection("appointments")
    .where("doctorId", "==", doctorId || authUser!.managedByDoctorId)
    .where("status", "==", "PENDING")
    .orderBy("date", "asc")
    .get();

  const appointments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return jsonResponse(appointments);
});
