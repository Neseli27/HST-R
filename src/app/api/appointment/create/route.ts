export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  apiHandler, verifyAuth, requireRoles, jsonResponse, errorResponse,
  generateTicketCode, generateDailyPrefix,
} from "@/lib/api-utils";
import type { AppointmentDoc, DoctorDoc, QueueSessionDoc } from "@/types";

/**
 * POST /api/appointment/create
 */
export const POST = apiHandler(async (req: NextRequest) => {
  const authUser = await verifyAuth(req);
  requireRoles(authUser, "PATIENT");

  const { doctorId, date, timeSlot, notes } = await req.json();

  if (!doctorId || !date || !timeSlot) {
    return errorResponse("Zorunlu alanlar eksik");
  }

  // Doktor bilgisi
  const doctorDoc = await adminDb.collection("doctors").doc(doctorId).get();
  if (!doctorDoc.exists) return errorResponse("Doktor bulunamadı", 404);
  const doctor = doctorDoc.data() as DoctorDoc;

  if (!doctor.isAvailable) return errorResponse("Doktor şu an randevu almıyor");

  // Slot müsait mi?
  const existing = await adminDb
    .collection("appointments")
    .where("doctorId", "==", doctorId)
    .where("date", "==", date)
    .where("timeSlot", "==", timeSlot)
    .where("status", "not-in", ["CANCELLED", "REJECTED"])
    .limit(1)
    .get();

  if (!existing.empty) return errorResponse("Bu saat dilimi dolu", 409);

  // Hasta bilgisi
  const patientDoc = await adminDb.collection("users").doc(authUser!.uid).get();
  const patient = patientDoc.data()!;

  // Hastane bilgisi
  const hospitalDoc = await adminDb.collection("hospitals").doc(doctor.hospitalId).get();
  const hospital = hospitalDoc.data()!;

  // Doktor kullanıcı bilgisi
  const doctorUserDoc = await adminDb.collection("users").doc(doctor.userId).get();
  const doctorUser = doctorUserDoc.data()!;

  // Ticket kodu üret — QueueSession'dan prefix al veya oluştur
  const sessionId = `${doctorId}_${date}`;
  const sessionRef = adminDb.collection("queueSessions").doc(sessionId);
  const sessionDoc = await sessionRef.get();

  let prefix: string;
  let sequence: number;

  if (sessionDoc.exists) {
    const session = sessionDoc.data() as QueueSessionDoc;
    prefix = session.dailyPrefix;
    sequence = session.nextOrderNumber;
    await sessionRef.update({ nextOrderNumber: sequence + 1 });
  } else {
    prefix = generateDailyPrefix();
    sequence = 1;
    const sessionData: QueueSessionDoc = {
      doctorId,
      date,
      isActive: true,
      currentNumber: 0,
      nextOrderNumber: 2,
      dailyPrefix: prefix,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await sessionRef.set(sessionData);
  }

  const ticketCode = generateTicketCode(prefix, sequence);

  const appointmentData: AppointmentDoc = {
    patientId: authUser!.uid,
    patientName: `${patient.firstName} ${patient.lastName}`,
    patientPhone: patient.phone,
    doctorId,
    doctorName: `${doctorUser.firstName} ${doctorUser.lastName}`,
    doctorTitle: doctor.title,
    departmentName: doctor.departmentName,
    hospitalId: doctor.hospitalId,
    hospitalName: hospital.name,
    date,
    timeSlot,
    status: "PENDING",
    ticketCode,
    notes: notes || null,
    rejectionReason: null,
    approvedAt: null,
    approvedBy: null,
    checkedInAt: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const ref = await adminDb.collection("appointments").add(appointmentData);

  return jsonResponse({ id: ref.id, ...appointmentData }, 201);
});
