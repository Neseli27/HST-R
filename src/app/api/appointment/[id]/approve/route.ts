import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { apiHandler, verifyAuth, requireRoles, jsonResponse, errorResponse } from "@/lib/api-utils";

/**
 * PATCH /api/appointment/[id]/approve
 */
export const PATCH = apiHandler(async (req: NextRequest, { params }: any) => {
  const authUser = await verifyAuth(req);
  requireRoles(authUser, "ASSISTANT");

  const ref = adminDb.collection("appointments").doc(params.id);
  const doc = await ref.get();

  if (!doc.exists) return errorResponse("Randevu bulunamadı", 404);
  if (doc.data()?.status !== "PENDING") return errorResponse("Bu randevu zaten işlenmiş");

  await ref.update({
    status: "APPROVED",
    approvedAt: new Date(),
    approvedBy: authUser!.uid,
    updatedAt: new Date(),
  });

  return jsonResponse({ id: params.id, status: "APPROVED" });
});
