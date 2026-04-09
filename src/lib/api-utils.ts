import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, DEMO_MODE } from "./firebase-admin";
import type { Role, UserDoc } from "@/types";

export function jsonResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

export interface AuthUser {
  uid: string;
  role: Role;
  hospitalId: string | null;
  doctorId: string | null;
  managedByDoctorId: string | null;
}

/**
 * Auth doğrulama — DEMO_MODE'da header'daki demo user ID'yi kullanır
 */
export async function verifyAuth(req: NextRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);

  try {
    if (DEMO_MODE) {
      // Demo mode: token = user ID (ör: "demo-patient")
      const userDoc = await adminDb.collection("users").doc(token).get();
      if (!userDoc.exists) return null;

      const user = userDoc.data() as UserDoc;

      let doctorId: string | null = null;
      if (user.role === "DOCTOR") {
        const doctorSnap = await adminDb
          .collection("doctors")
          .where("userId", "==", token)
          .limit(1)
          .get();
        if (!doctorSnap.empty) doctorId = doctorSnap.docs[0].id;
      }

      return {
        uid: token,
        role: user.role,
        hospitalId: user.hospitalId,
        doctorId,
        managedByDoctorId: user.managedByDoctorId,
      };
    }

    // Production: Firebase Auth token doğrula
    const decoded = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
    if (!userDoc.exists) return null;

    const user = userDoc.data() as UserDoc;
    if (!user.isActive) return null;

    let doctorId: string | null = null;
    if (user.role === "DOCTOR") {
      const doctorSnap = await adminDb
        .collection("doctors")
        .where("userId", "==", decoded.uid)
        .limit(1)
        .get();
      if (!doctorSnap.empty) doctorId = doctorSnap.docs[0].id;
    }

    return {
      uid: decoded.uid,
      role: user.role,
      hospitalId: user.hospitalId,
      doctorId,
      managedByDoctorId: user.managedByDoctorId,
    };
  } catch {
    return null;
  }
}

export function requireRoles(user: AuthUser | null, ...roles: Role[]): AuthUser {
  if (!user) throw new AuthError("Kimlik doğrulama gerekli", 401);
  if (!roles.includes(user.role)) throw new AuthError("Bu işlem için yetkiniz yok", 403);
  return user;
}

export class AuthError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export function apiHandler(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
    try {
      return await handler(req, context);
    } catch (err) {
      if (err instanceof AuthError) {
        return errorResponse(err.message, err.status);
      }
      console.error("API Error:", err);
      const message = err instanceof Error ? err.message : "Sunucu hatası";
      return errorResponse(message, 500);
    }
  };
}

export function generateTicketCode(prefix: string, sequence: number): string {
  return `${prefix}-${String(sequence).padStart(3, "0")}`;
}

export function generateDailyPrefix(): string {
  return String(Math.floor(100 + Math.random() * 900));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
