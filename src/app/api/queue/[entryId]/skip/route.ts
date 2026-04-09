import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { apiHandler, verifyAuth, requireRoles, jsonResponse, errorResponse } from "@/lib/api-utils";

/**
 * PATCH /api/queue/[entryId]/skip — hasta gelmedi, atla
 */
export const PATCH = apiHandler(async (req: NextRequest, { params }: any) => {
  const authUser = await verifyAuth(req);
  requireRoles(authUser, "ASSISTANT");

  const ref = adminDb.collection("queueEntries").doc(params.entryId);
  const doc = await ref.get();

  if (!doc.exists) return errorResponse("Sıra kaydı bulunamadı", 404);

  const batch = adminDb.batch();
  batch.update(ref, { status: "SKIPPED", updatedAt: new Date() });

  const appointmentId = doc.data()?.appointmentId;
  if (appointmentId) {
    batch.update(adminDb.collection("appointments").doc(appointmentId), {
      status: "NO_SHOW",
      updatedAt: new Date(),
    });
  }

  await batch.commit();
  return jsonResponse({ id: params.entryId, status: "SKIPPED" });
});
