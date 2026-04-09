import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { apiHandler, verifyAuth, requireRoles, jsonResponse, errorResponse } from "@/lib/api-utils";
import { QUEUE_NOTIFY_AHEAD } from "@/types";

/**
 * POST /api/queue/call-next — sonraki hastayı çağır
 */
export const POST = apiHandler(async (req: NextRequest) => {
  const authUser = await verifyAuth(req);
  requireRoles(authUser, "ASSISTANT");

  const userDoc = await adminDb.collection("users").doc(authUser!.uid).get();
  const doctorId = userDoc.data()?.managedByDoctorId || authUser!.doctorId;
  if (!doctorId) return errorResponse("Doktor bilgisi bulunamadı", 403);

  const today = new Date().toISOString().split("T")[0];
  const sessionId = `${doctorId}_${today}`;

  // Sıradaki WAITING veya RETURNED hasta (öncelik: priority desc, orderNumber asc)
  const waiting = await adminDb
    .collection("queueEntries")
    .where("queueSessionId", "==", sessionId)
    .where("status", "in", ["WAITING", "RETURNED"])
    .orderBy("priority", "desc")
    .orderBy("orderNumber", "asc")
    .limit(1)
    .get();

  if (waiting.empty) return errorResponse("Sırada bekleyen hasta yok");

  const nextEntry = waiting.docs[0];
  const nextData = nextEntry.data();

  // Mevcut IN_ROOM hastaları COMPLETED yap
  const inRoom = await adminDb
    .collection("queueEntries")
    .where("queueSessionId", "==", sessionId)
    .where("status", "==", "IN_ROOM")
    .get();

  const batch = adminDb.batch();
  inRoom.docs.forEach((doc) => {
    batch.update(doc.ref, {
      status: "COMPLETED",
      completedAt: new Date(),
      updatedAt: new Date(),
    });
    // Randevuyu da tamamla
    if (doc.data().appointmentId) {
      batch.update(adminDb.collection("appointments").doc(doc.data().appointmentId), {
        status: "COMPLETED",
        completedAt: new Date(),
        updatedAt: new Date(),
      });
    }
  });

  // Sonraki hastayı çağır
  batch.update(nextEntry.ref, {
    status: "CALLED",
    calledAt: new Date(),
    updatedAt: new Date(),
  });

  // Session currentNumber güncelle
  batch.update(adminDb.collection("queueSessions").doc(sessionId), {
    currentNumber: nextData.orderNumber,
    updatedAt: new Date(),
  });

  await batch.commit();

  // Sonraki bekleyenlere bildirim (FCM)
  await notifyUpcoming(sessionId, nextData.orderNumber);

  return jsonResponse({
    id: nextEntry.id,
    ...nextData,
    status: "CALLED",
    calledAt: new Date(),
  });
});

async function notifyUpcoming(sessionId: string, currentOrder: number) {
  const upcoming = await adminDb
    .collection("queueEntries")
    .where("queueSessionId", "==", sessionId)
    .where("status", "==", "WAITING")
    .where("orderNumber", ">", currentOrder)
    .orderBy("orderNumber", "asc")
    .limit(QUEUE_NOTIFY_AHEAD + 1)
    .get();

  const batch = adminDb.batch();
  for (let i = 0; i < Math.min(upcoming.size, QUEUE_NOTIFY_AHEAD); i++) {
    const doc = upcoming.docs[i];
    batch.update(doc.ref, { status: "NOTIFIED", updatedAt: new Date() });

    // FCM push notification gönder
    try {
      const patientDoc = await adminDb.collection("users").doc(doc.data().patientId).get();
      const tokens = patientDoc.data()?.fcmTokens || [];
      if (tokens.length > 0) {
        const { adminMessaging } = await import("@/lib/firebase-admin");
        await adminMessaging.sendEachForMulticast({
          tokens,
          notification: {
            title: "Sıranız Yaklaşıyor!",
            body: `Önünüzde ${i + 1} kişi kaldı. Lütfen hazır olun.`,
          },
          data: { type: "QUEUE_ALERT", appointmentId: doc.data().appointmentId },
        });
      }
    } catch (err) {
      console.error("FCM send error:", err);
    }
  }

  if (!upcoming.empty) await batch.commit();
}
