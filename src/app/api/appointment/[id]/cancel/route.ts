import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { apiHandler, verifyAuth, requireRoles, jsonResponse, errorResponse } from "@/lib/api-utils";

/**
 * DELETE /api/appointment/[id]/cancel
 */
export const DELETE = apiHandler(async (req: NextRequest, { params }: any) => {
  const authUser = await verifyAuth(req);
  requireRoles(authUser, "PATIENT");

  const ref = adminDb.collection("appointments").doc(params.id);
  const doc = await ref.get();

  if (!doc.exists) return errorResponse("Randevu bulunamadı", 404);

  const data = doc.data()!;
  if (data.patientId !== authUser!.uid) return errorResponse("Bu randevu size ait değil", 403);
  if (!["PENDING", "APPROVED"].includes(data.status)) {
    return errorResponse("Bu randevu iptal edilemez");
  }

  await ref.update({
    status: "CANCELLED",
    updatedAt: new Date(),
  });

  return jsonResponse({ id: params.id, status: "CANCELLED" });
});
