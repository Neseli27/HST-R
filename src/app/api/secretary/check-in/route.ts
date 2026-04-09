export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  apiHandler, verifyAuth, requireRoles, jsonResponse, errorResponse,
  generateTicketCode, generateDailyPrefix,
} from "@/lib/api-utils";
import type { QueueEntryDoc, QueueSessionDoc } from "@/types";

/**
 * POST /api/secretary/check-in — QR veya ticket kodu ile check-in
 * Body: { ticketCode: "123-456" } veya { appointmentId: "xxx" }
 */
export const POST = apiHandler(async (req: NextRequest) => {
  const authUser = await verifyAuth(req);
  requireRoles(authUser, "SECRETARY");

  const { ticketCode, appointmentId } = await req.json();

  let appointmentRef;
  let appointmentDoc;

  if (appointmentId) {
    appointmentRef = adminDb.collection("appointments").doc(appointmentId);
    appointmentDoc = await appointmentRef.get();
  } else if (ticketCode) {
    const snapshot = await adminDb
      .collection("appointments")
      .where("ticketCode", "==", ticketCode)
      .limit(1)
      .get();

    if (snapshot.empty) return errorResponse("Randevu bulunamadı", 404);
    appointmentRef = snapshot.docs[0].ref;
    appointmentDoc = snapshot.docs[0];
  } else {
    return errorResponse("ticketCode veya appointmentId gerekli");
  }

  if (!appointmentDoc.exists) return errorResponse("Randevu bulunamadı", 404);

  const appointment = appointmentDoc.data()!;
  if (appointment.status !== "APPROVED") {
    return errorResponse("Bu randevu check-in için uygun değil. Durum: " + appointment.status);
  }

  // Check-in yap
  await appointmentRef.update({
    status: "CHECKED_IN",
    checkedInAt: new Date(),
    updatedAt: new Date(),
  });

  // Sıraya ekle
  const today = new Date().toISOString().split("T")[0];
  const sessionId = `${appointment.doctorId}_${today}`;
  const sessionRef = adminDb.collection("queueSessions").doc(sessionId);
  const sessionDoc = await sessionRef.get();

  let orderNumber: number;

  if (sessionDoc.exists) {
    const session = sessionDoc.data() as QueueSessionDoc;
    orderNumber = session.nextOrderNumber;
    await sessionRef.update({
      nextOrderNumber: orderNumber + 1,
      updatedAt: new Date(),
    });
  } else {
    orderNumber = 1;
    const sessionData: QueueSessionDoc = {
      doctorId: appointment.doctorId,
      date: today,
      isActive: true,
      currentNumber: 0,
      nextOrderNumber: 2,
      dailyPrefix: generateDailyPrefix(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await sessionRef.set(sessionData);
  }

  const entryData: QueueEntryDoc = {
    queueSessionId: sessionId,
    appointmentId: appointmentDoc.id,
    patientId: appointment.patientId,
    patientName: appointment.patientName,
    orderNumber,
    displayCode: appointment.ticketCode,
    status: "WAITING",
    priority: 0,
    appointmentTime: appointment.timeSlot,
    calledAt: null,
    enteredAt: null,
    pausedAt: null,
    returnedAt: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const entryRef = await adminDb.collection("queueEntries").add(entryData);

  return jsonResponse({
    queueEntryId: entryRef.id,
    ticketCode: appointment.ticketCode,
    orderNumber,
    message: "Check-in başarılı. Hasta sıraya eklendi.",
  });
});
