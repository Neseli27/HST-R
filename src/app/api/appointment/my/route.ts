import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { apiHandler, verifyAuth, requireRoles, jsonResponse } from "@/lib/api-utils";

/**
 * GET /api/appointment/my — hasta kendi randevularını listeler
 */
export const GET = apiHandler(async (req: NextRequest) => {
  const authUser = await verifyAuth(req);
  requireRoles(authUser, "PATIENT");

  const snapshot = await adminDb
    .collection("appointments")
    .where("patientId", "==", authUser!.uid)
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  const appointments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return jsonResponse(appointments);
});
