import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { apiHandler, verifyAuth, requireRoles, jsonResponse } from "@/lib/api-utils";

/**
 * GET /api/queue/my — hasta kendi sırasını sorgular
 */
export const GET = apiHandler(async (req: NextRequest) => {
  const authUser = await verifyAuth(req);
  requireRoles(authUser, "PATIENT");

  const activeStatuses = ["WAITING", "NOTIFIED", "CALLED", "IN_ROOM", "RETURNED"];

  const snapshot = await adminDb
    .collection("queueEntries")
    .where("patientId", "==", authUser!.uid)
    .where("status", "in", activeStatuses)
    .limit(1)
    .get();

  if (snapshot.empty) return jsonResponse(null);

  const entry = snapshot.docs[0];
  const data = entry.data();

  // Önündeki kişi sayısını hesapla
  const ahead = await adminDb
    .collection("queueEntries")
    .where("queueSessionId", "==", data.queueSessionId)
    .where("orderNumber", "<", data.orderNumber)
    .where("status", "in", activeStatuses)
    .count()
    .get();

  // Doktor bilgisi
  const doctorDoc = await adminDb.collection("doctors").doc(data.queueSessionId.split("_")[0]).get();
  const doctor = doctorDoc.data();
  const doctorUser = doctor ? await adminDb.collection("users").doc(doctor.userId).get() : null;

  return jsonResponse({
    id: entry.id,
    displayCode: data.displayCode,
    status: data.status,
    positionAhead: ahead.data().count,
    estimatedWaitMinutes: ahead.data().count * 15,
    doctor: doctor
      ? {
          name: `${doctor.title} ${doctorUser?.data()?.firstName} ${doctorUser?.data()?.lastName}`,
          department: doctor.departmentName,
          roomNumber: doctor.roomNumber,
        }
      : null,
  });
});
