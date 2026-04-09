import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { apiHandler, verifyAuth, requireRoles, jsonResponse } from "@/lib/api-utils";

/**
 * PATCH /api/superadmin/hospitals/[id]/suspend
 */
export const PATCH = apiHandler(async (req: NextRequest, { params }: any) => {
  const authUser = await verifyAuth(req);
  requireRoles(authUser, "SUPERADMIN");

  await adminDb.collection("hospitals").doc(params.id).update({
    status: "SUSPENDED",
    updatedAt: new Date(),
  });

  return jsonResponse({ id: params.id, status: "SUSPENDED" });
});
