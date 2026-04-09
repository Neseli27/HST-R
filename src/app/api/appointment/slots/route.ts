import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { apiHandler, verifyAuth, jsonResponse, errorResponse } from "@/lib/api-utils";
import type { DoctorDoc, WorkingHours, TimeSlot } from "@/types";

/**
 * GET /api/appointment/slots?doctorId=xxx&date=2024-03-15
 */
export const GET = apiHandler(async (req: NextRequest) => {
  await verifyAuth(req); // sadece auth gerekli

  const doctorId = req.nextUrl.searchParams.get("doctorId");
  const date = req.nextUrl.searchParams.get("date");

  if (!doctorId || !date) return errorResponse("doctorId ve date gerekli");

  // Doktor bilgisi
  const doctorDoc = await adminDb.collection("doctors").doc(doctorId).get();
  if (!doctorDoc.exists) return errorResponse("Doktor bulunamadı", 404);

  const doctor = doctorDoc.data() as DoctorDoc;

  // Haftanın günü
  const dayOfWeek = new Date(date)
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

  const hours = (doctor.workingHours as WorkingHours)[dayOfWeek];
  if (!hours) return jsonResponse([]); // O gün çalışmıyor

  // Blok kontrolü
  const blocks = await adminDb
    .collection("scheduleBlocks")
    .where("doctorId", "==", doctorId)
    .where("date", "==", date)
    .where("isFullDay", "==", true)
    .limit(1)
    .get();

  if (!blocks.empty) return jsonResponse([]);

  // Tüm slotları üret
  const slots: string[] = [];
  const [startH, startM] = hours.start.split(":").map(Number);
  const [endH, endM] = hours.end.split(":").map(Number);
  let current = startH * 60 + startM;
  const end = endH * 60 + endM;

  while (current < end) {
    const h = String(Math.floor(current / 60)).padStart(2, "0");
    const m = String(current % 60).padStart(2, "0");
    slots.push(`${h}:${m}`);
    current += hours.slotMinutes;
  }

  // Alınmış slotlar
  const taken = await adminDb
    .collection("appointments")
    .where("doctorId", "==", doctorId)
    .where("date", "==", date)
    .where("status", "not-in", ["CANCELLED", "REJECTED"])
    .get();

  const takenSet = new Set(taken.docs.map((d) => d.data().timeSlot));
  const isFull = taken.size >= doctor.dailyQuota;

  const result: TimeSlot[] = slots.map((time) => ({
    time,
    available: !isFull && !takenSet.has(time),
  }));

  return jsonResponse(result);
});
