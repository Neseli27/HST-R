export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { apiHandler, verifyAuth, requireRoles, jsonResponse } from "@/lib/api-utils";

/**
 * GET /api/superadmin/stats
 */
export const GET = apiHandler(async (req: NextRequest) => {
  const authUser = await verifyAuth(req);
  requireRoles(authUser, "SUPERADMIN");

  const [hospitals, doctors, patients, appointments] = await Promise.all([
    adminDb.collection("hospitals").count().get(),
    adminDb.collection("doctors").count().get(),
    adminDb.collection("users").where("role", "==", "PATIENT").count().get(),
    adminDb.collection("appointments").count().get(),
  ]);

  return jsonResponse({
    hospitals: hospitals.data().count,
    doctors: doctors.data().count,
    patients: patients.data().count,
    appointments: appointments.data().count,
  });
});
