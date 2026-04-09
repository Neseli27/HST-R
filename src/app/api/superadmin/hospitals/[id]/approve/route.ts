export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth, requireRoles, jsonResponse, errorResponse, AuthError } from "@/lib/api-utils";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await verifyAuth(req);
    requireRoles(authUser, "SUPERADMIN");

    const hospitalRef = adminDb.collection("hospitals").doc(params.id);
    const hospitalDoc = await hospitalRef.get();

    if (!hospitalDoc.exists) return errorResponse("Hastane bulunamadı", 404);
    if (hospitalDoc.data()?.status !== "PENDING") return errorResponse("Hastane zaten işlenmiş");

    await hospitalRef.update({
      status: "APPROVED",
      approvedAt: new Date(),
      approvedBy: authUser!.uid,
      updatedAt: new Date(),
    });

    return jsonResponse({ id: params.id, status: "APPROVED" });
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.status);
    return errorResponse(err instanceof Error ? err.message : "Sunucu hatası", 500);
  }
}
