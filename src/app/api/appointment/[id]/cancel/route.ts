export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth, requireRoles, jsonResponse, errorResponse, AuthError } from "@/lib/api-utils";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
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

    await ref.update({ status: "CANCELLED", updatedAt: new Date() });

    return jsonResponse({ id: params.id, status: "CANCELLED" });
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.status);
    return errorResponse(err instanceof Error ? err.message : "Sunucu hatası", 500);
  }
}
