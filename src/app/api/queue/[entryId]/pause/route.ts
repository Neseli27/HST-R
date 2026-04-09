import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { apiHandler, verifyAuth, requireRoles, jsonResponse, errorResponse } from "@/lib/api-utils";

/**
 * PATCH /api/queue/[entryId]/pause — geçici ayrılma
 */
export const PATCH = apiHandler(async (req: NextRequest, { params }: any) => {
  const authUser = await verifyAuth(req);
  requireRoles(authUser, "ASSISTANT");

  const ref = adminDb.collection("queueEntries").doc(params.entryId);
  const doc = await ref.get();

  if (!doc.exists) return errorResponse("Sıra kaydı bulunamadı", 404);

  const batch = adminDb.batch();
  batch.update(ref, {
    status: "PAUSED",
    pausedAt: new Date(),
    updatedAt: new Date(),
  });

  // Randevu durumunu da güncelle
  const appointmentId = doc.data()?.appointmentId;
  if (appointmentId) {
    batch.update(adminDb.collection("appointments").doc(appointmentId), {
      status: "PAUSED",
      updatedAt: new Date(),
    });
  }

  await batch.commit();
  return jsonResponse({ id: params.entryId, status: "PAUSED" });
});
