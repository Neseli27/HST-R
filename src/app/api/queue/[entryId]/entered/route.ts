export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth, requireRoles, jsonResponse, errorResponse, AuthError } from "@/lib/api-utils";

export async function PATCH(req: NextRequest, { params }: { params: { entryId: string } }) {
  try {
    const authUser = await verifyAuth(req);
    requireRoles(authUser, "ASSISTANT");

    const ref = adminDb.collection("queueEntries").doc(params.entryId);
    const doc = await ref.get();

    if (!doc.exists) return errorResponse("Sıra kaydı bulunamadı", 404);

    await ref.update({ status: "IN_ROOM", enteredAt: new Date(), updatedAt: new Date() });

    const appointmentId = doc.data()?.appointmentId;
    if (appointmentId) {
      await adminDb.collection("appointments").doc(appointmentId).update({
        status: "IN_PROGRESS",
        updatedAt: new Date(),
      });
    }

    return jsonResponse({ id: params.entryId, status: "IN_ROOM" });
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.status);
    return errorResponse(err instanceof Error ? err.message : "Sunucu hatası", 500);
  }
}
