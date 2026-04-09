import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { apiHandler, verifyAuth, requireRoles, jsonResponse, errorResponse } from "@/lib/api-utils";
import { QUEUE_RETURN_OFFSET } from "@/types";

/**
 * PATCH /api/queue/[entryId]/return — geçici ayrılan hasta geri döndü
 * Mevcut sıradan +2 konuma yerleştirir
 */
export const PATCH = apiHandler(async (req: NextRequest, { params }: any) => {
  const authUser = await verifyAuth(req);
  requireRoles(authUser, "ASSISTANT");

  const ref = adminDb.collection("queueEntries").doc(params.entryId);
  const doc = await ref.get();

  if (!doc.exists) return errorResponse("Sıra kaydı bulunamadı", 404);

  const entryData = doc.data()!;
  const sessionId = entryData.queueSessionId;

  // Mevcut session'ın currentNumber'ını al
  const sessionDoc = await adminDb.collection("queueSessions").doc(sessionId).get();
  const currentNumber = sessionDoc.data()?.currentNumber || 0;

  // Bekleyen hastaları bul
  const waiting = await adminDb
    .collection("queueEntries")
    .where("queueSessionId", "==", sessionId)
    .where("status", "in", ["WAITING", "NOTIFIED"])
    .where("orderNumber", ">", currentNumber)
    .orderBy("orderNumber", "asc")
    .get();

  let newOrderNumber: number;

  if (waiting.size <= QUEUE_RETURN_OFFSET) {
    // Yeterli bekleyen yok, sona ekle
    const allEntries = await adminDb
      .collection("queueEntries")
      .where("queueSessionId", "==", sessionId)
      .orderBy("orderNumber", "desc")
      .limit(1)
      .get();
    newOrderNumber = (allEntries.empty ? 0 : allEntries.docs[0].data().orderNumber) + 1;
  } else {
    // OFFSET kadar kişiden sonraya yerleştir
    const insertAfter = waiting.docs[QUEUE_RETURN_OFFSET - 1];
    newOrderNumber = insertAfter.data().orderNumber + 1;

    // Sonraki entries'lerin orderNumber'larını 1 artır
    const batch = adminDb.batch();
    for (let i = QUEUE_RETURN_OFFSET; i < waiting.size; i++) {
      const d = waiting.docs[i];
      batch.update(d.ref, {
        orderNumber: d.data().orderNumber + 1,
        updatedAt: new Date(),
      });
    }
    await batch.commit();
  }

  // Hastayı yeni konumuna yerleştir
  const updateBatch = adminDb.batch();
  updateBatch.update(ref, {
    status: "RETURNED",
    returnedAt: new Date(),
    orderNumber: newOrderNumber,
    priority: 1, // Dönen hasta biraz öncelikli
    updatedAt: new Date(),
  });

  // Randevu durumunu güncelle
  if (entryData.appointmentId) {
    updateBatch.update(adminDb.collection("appointments").doc(entryData.appointmentId), {
      status: "RESUMED",
      updatedAt: new Date(),
    });
  }

  await updateBatch.commit();
  return jsonResponse({ id: params.entryId, status: "RETURNED", newOrderNumber });
});
