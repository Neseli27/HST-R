import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { apiHandler, verifyAuth, requireRoles, jsonResponse, errorResponse } from "@/lib/api-utils";

/**
 * PATCH /api/queue/[entryId]/entered — hasta odaya girdi
 */
export const PATCH = apiHandler(async (req: NextRequest, { params }: any) => {
  const authUser = await verifyAuth(req);
  requireRoles(authUser, "ASSISTANT");

  const ref = adminDb.collection("queueEntries").doc(params.entryId);
  const doc = await ref.get();

  if (!doc.exists) return errorResponse("Sıra kaydı bulunamadı", 404);

  await ref.update({
    status: "IN_ROOM",
    enteredAt: new Date(),
    updatedAt: new Date(),
  });

  // Randevu durumunu güncelle
  const appointmentId = doc.data()?.appointmentId;
  if (appointmentId) {
    await adminDb.collection("appointments").doc(appointmentId).update({
      status: "IN_PROGRESS",
      updatedAt: new Date(),
    });
  }

  return jsonResponse({ id: params.entryId, status: "IN_ROOM" });
});
