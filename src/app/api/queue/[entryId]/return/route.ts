export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth, requireRoles, jsonResponse, errorResponse, AuthError } from "@/lib/api-utils";
import { QUEUE_RETURN_OFFSET } from "@/types";

export async function PATCH(req: NextRequest, { params }: { params: { entryId: string } }) {
  try {
    const authUser = await verifyAuth(req);
    requireRoles(authUser, "ASSISTANT");

    const ref = adminDb.collection("queueEntries").doc(params.entryId);
    const doc = await ref.get();

    if (!doc.exists) return errorResponse("Sıra kaydı bulunamadı", 404);

    const entryData = doc.data()!;
    const sessionId = entryData.queueSessionId;

    const sessionDoc = await adminDb.collection("queueSessions").doc(sessionId).get();
    const currentNumber = sessionDoc.data()?.currentNumber || 0;

    const waiting = await adminDb
      .collection("queueEntries")
      .where("queueSessionId", "==", sessionId)
      .where("status", "in", ["WAITING", "NOTIFIED"])
      .where("orderNumber", ">", currentNumber)
      .orderBy("orderNumber", "asc")
      .get();

    let newOrderNumber: number;

    if (waiting.size <= QUEUE_RETURN_OFFSET) {
      const allEntries = await adminDb
        .collection("queueEntries")
        .where("queueSessionId", "==", sessionId)
        .orderBy("orderNumber", "desc")
        .limit(1)
        .get();
      newOrderNumber = (allEntries.empty ? 0 : allEntries.docs[0].data().orderNumber) + 1;
    } else {
      const insertAfter = waiting.docs[QUEUE_RETURN_OFFSET - 1];
      newOrderNumber = insertAfter.data().orderNumber + 1;

      const batch = adminDb.batch();
      for (let i = QUEUE_RETURN_OFFSET; i < waiting.size; i++) {
        const d = waiting.docs[i];
        batch.update(d.ref, { orderNumber: d.data().orderNumber + 1, updatedAt: new Date() });
      }
      await batch.commit();
    }

    const updateBatch = adminDb.batch();
    updateBatch.update(ref, {
      status: "RETURNED",
      returnedAt: new Date(),
      orderNumber: newOrderNumber,
      priority: 1,
      updatedAt: new Date(),
    });

    if (entryData.appointmentId) {
      updateBatch.update(adminDb.collection("appointments").doc(entryData.appointmentId), {
        status: "RESUMED",
        updatedAt: new Date(),
      });
    }

    await updateBatch.commit();
    return jsonResponse({ id: params.entryId, status: "RETURNED", newOrderNumber });
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.status);
    return errorResponse(err instanceof Error ? err.message : "Sunucu hatası", 500);
  }
}
