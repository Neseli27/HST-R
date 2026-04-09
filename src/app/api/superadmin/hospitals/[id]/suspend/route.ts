export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth, requireRoles, jsonResponse, errorResponse, AuthError } from "@/lib/api-utils";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await verifyAuth(req);
    requireRoles(authUser, "SUPERADMIN");

    await adminDb.collection("hospitals").doc(params.id).update({
      status: "SUSPENDED",
      updatedAt: new Date(),
    });

    return jsonResponse({ id: params.id, status: "SUSPENDED" });
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.status);
    return errorResponse(err instanceof Error ? err.message : "Sunucu hatası", 500);
  }
}
