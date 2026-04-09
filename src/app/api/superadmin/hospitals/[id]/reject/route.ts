import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { apiHandler, verifyAuth, requireRoles, jsonResponse, errorResponse } from "@/lib/api-utils";

/**
 * PATCH /api/superadmin/hospitals/[id]/reject
 */
export const PATCH = apiHandler(async (req: NextRequest, { params }: any) => {
  const authUser = await verifyAuth(req);
  requireRoles(authUser, "SUPERADMIN");

  const hospitalRef = adminDb.collection("hospitals").doc(params.id);
  const hospitalDoc = await hospitalRef.get();

  if (!hospitalDoc.exists) return errorResponse("Hastane bulunamadı", 404);

  await hospitalRef.update({
    status: "REJECTED",
    updatedAt: new Date(),
  });

  return jsonResponse({ id: params.id, status: "REJECTED" });
});
