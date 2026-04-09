export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth, requireRoles, jsonResponse, errorResponse, AuthError } from "@/lib/api-utils";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await verifyAuth(req);
    requireRoles(authUser, "ASSISTANT");

    const { reason } = await req.json().catch(() => ({ reason: undefined }));

    const ref = adminDb.collection("appointments").doc(params.id);
    const doc = await ref.get();

    if (!doc.exists) return errorResponse("Randevu bulunamadı", 404);
    if (doc.data()?.status !== "PENDING") return errorResponse("Bu randevu zaten işlenmiş");

    await ref.update({
      status: "REJECTED",
      rejectionReason: reason || null,
      updatedAt: new Date(),
    });

    return jsonResponse({ id: params.id, status: "REJECTED" });
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.status);
    return errorResponse(err instanceof Error ? err.message : "Sunucu hatası", 500);
  }
}
