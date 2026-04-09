import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { apiHandler, verifyAuth, requireRoles, jsonResponse, errorResponse } from "@/lib/api-utils";

/**
 * PATCH /api/superadmin/hospitals/[id]/approve
 */
export const PATCH = apiHandler(async (req: NextRequest, { params }: any) => {
  const authUser = await verifyAuth(req);
  requireRoles(authUser, "SUPERADMIN");

  const hospitalRef = adminDb.collection("hospitals").doc(params.id);
  const hospitalDoc = await hospitalRef.get();

  if (!hospitalDoc.exists) return errorResponse("Hastane bulunamadı", 404);
  if (hospitalDoc.data()?.status !== "PENDING") {
    return errorResponse("Hastane zaten işlenmiş");
  }

  await hospitalRef.update({
    status: "APPROVED",
    approvedAt: new Date(),
    approvedBy: authUser!.uid,
    updatedAt: new Date(),
  });

  return jsonResponse({ id: params.id, status: "APPROVED" });
});
