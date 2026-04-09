import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { apiHandler, verifyAuth, requireRoles, jsonResponse, errorResponse } from "@/lib/api-utils";
import type { DepartmentDoc } from "@/types";

/**
 * GET /api/hospital/departments
 * POST /api/hospital/departments
 */
export const GET = apiHandler(async (req: NextRequest) => {
  const authUser = await verifyAuth(req);
  requireRoles(authUser, "HOSPITAL_ADMIN");

  const snapshot = await adminDb
    .collection("departments")
    .where("hospitalId", "==", authUser!.hospitalId)
    .orderBy("name")
    .get();

  const departments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return jsonResponse(departments);
});

export const POST = apiHandler(async (req: NextRequest) => {
  const authUser = await verifyAuth(req);
  requireRoles(authUser, "HOSPITAL_ADMIN");

  const { name } = await req.json();
  if (!name) return errorResponse("Bölüm adı gerekli");

  // Aynı isimde bölüm var mı?
  const existing = await adminDb
    .collection("departments")
    .where("hospitalId", "==", authUser!.hospitalId)
    .where("name", "==", name)
    .limit(1)
    .get();

  if (!existing.empty) return errorResponse("Bu bölüm zaten mevcut", 409);

  const deptData: DepartmentDoc = {
    name,
    hospitalId: authUser!.hospitalId!,
    createdAt: new Date(),
  };

  const ref = await adminDb.collection("departments").add(deptData);
  return jsonResponse({ id: ref.id, ...deptData }, 201);
});
