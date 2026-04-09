import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { apiHandler, verifyAuth, requireRoles, jsonResponse } from "@/lib/api-utils";

/**
 * GET /api/superadmin/hospitals?status=PENDING
 */
export const GET = apiHandler(async (req: NextRequest) => {
  const authUser = await verifyAuth(req);
  requireRoles(authUser, "SUPERADMIN");

  const status = req.nextUrl.searchParams.get("status") || "PENDING";

  const snapshot = await adminDb
    .collection("hospitals")
    .where("status", "==", status)
    .orderBy("createdAt", "desc")
    .get();

  const hospitals = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return jsonResponse(hospitals);
});
