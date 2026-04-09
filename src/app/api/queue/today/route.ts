export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { apiHandler, verifyAuth, requireRoles, jsonResponse, errorResponse } from "@/lib/api-utils";

/**
 * GET /api/queue/today — asistan/doktor: bugünün sıra listesi
 */
export const GET = apiHandler(async (req: NextRequest) => {
  const authUser = await verifyAuth(req);
  requireRoles(authUser, "ASSISTANT", "DOCTOR");

  // Doktor ID'sini bul
  let doctorId = authUser!.doctorId;
  if (!doctorId && authUser!.managedByDoctorId) {
    // Asistan ise, bağlı olduğu doktorun ID'sini al
    const userDoc = await adminDb.collection("users").doc(authUser!.uid).get();
    const managedByDoctorId = userDoc.data()?.managedByDoctorId;
    if (managedByDoctorId) {
      // managedByDoctorId = doctors collection'daki doc ID
      doctorId = managedByDoctorId;
    }
  }

  if (!doctorId) return errorResponse("Doktor bilgisi bulunamadı", 403);

  const today = new Date().toISOString().split("T")[0];
  const sessionId = `${doctorId}_${today}`;

  const sessionDoc = await adminDb.collection("queueSessions").doc(sessionId).get();

  const entries = await adminDb
    .collection("queueEntries")
    .where("queueSessionId", "==", sessionId)
    .orderBy("orderNumber", "asc")
    .get();

  const entryList = entries.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return jsonResponse({
    session: sessionDoc.exists ? { id: sessionId, ...sessionDoc.data() } : null,
    entries: entryList,
  });
});
