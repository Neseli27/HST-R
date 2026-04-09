/**
 * Firebase Admin SDK — DEMO_MODE'da in-memory store kullanır
 * Production'da Firebase Admin SDK kullanır
 */

const DEMO_MODE = !process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY.includes("YOUR_KEY");

// ==================== In-Memory Demo Store ====================

const demoStore: Record<string, Record<string, any>> = {
  users: {
    "demo-superadmin": {
      uid: "demo-superadmin", phone: "05000000000", email: "admin@hstr.com",
      firstName: "Süper", lastName: "Admin", role: "SUPERADMIN",
      hospitalId: null, managedByDoctorId: null, isActive: true,
      fcmTokens: [], tcNo: null, gender: null, birthDate: null, avatarUrl: null,
      createdAt: new Date(), updatedAt: new Date(),
    },
    "demo-hospital-admin": {
      uid: "demo-hospital-admin", phone: "05001111111", email: "yonetim@ornekdevlet.com",
      firstName: "Ahmet", lastName: "Yıldız", role: "HOSPITAL_ADMIN",
      hospitalId: "demo-hospital", managedByDoctorId: null, isActive: true,
      fcmTokens: [], tcNo: null, gender: null, birthDate: null, avatarUrl: null,
      createdAt: new Date(), updatedAt: new Date(),
    },
    "demo-doctor": {
      uid: "demo-doctor", phone: "05002222222", email: "dr.mehmet@ornekdevlet.com",
      firstName: "Mehmet", lastName: "Demir", role: "DOCTOR",
      hospitalId: "demo-hospital", managedByDoctorId: null, isActive: true,
      fcmTokens: [], tcNo: null, gender: null, birthDate: null, avatarUrl: null,
      createdAt: new Date(), updatedAt: new Date(),
    },
    "demo-assistant": {
      uid: "demo-assistant", phone: "05003333333", email: "asistan@ornekdevlet.com",
      firstName: "Ayşe", lastName: "Kaya", role: "ASSISTANT",
      hospitalId: "demo-hospital", managedByDoctorId: "demo-doctor-profile", isActive: true,
      fcmTokens: [], tcNo: null, gender: null, birthDate: null, avatarUrl: null,
      createdAt: new Date(), updatedAt: new Date(),
    },
    "demo-secretary": {
      uid: "demo-secretary", phone: "05004444444", email: "sekreter@ornekdevlet.com",
      firstName: "Fatma", lastName: "Çelik", role: "SECRETARY",
      hospitalId: "demo-hospital", managedByDoctorId: "demo-doctor-profile", isActive: true,
      fcmTokens: [], tcNo: null, gender: null, birthDate: null, avatarUrl: null,
      createdAt: new Date(), updatedAt: new Date(),
    },
    "demo-patient": {
      uid: "demo-patient", phone: "05005555555", email: null,
      firstName: "Ali", lastName: "Veli", role: "PATIENT",
      hospitalId: null, managedByDoctorId: null, isActive: true,
      fcmTokens: [], tcNo: null, gender: "MALE", birthDate: null, avatarUrl: null,
      createdAt: new Date(), updatedAt: new Date(),
    },
  },
  hospitals: {
    "demo-hospital": {
      name: "Örnek Devlet Hastanesi", slug: "ornek-devlet-hastanesi",
      address: "Cumhuriyet Cad. No:1", city: "İstanbul", district: "Kadıköy",
      phone: "02161234567", email: "info@ornekdevlet.com", taxNumber: "1234567890",
      status: "APPROVED", logoUrl: null, qrToken: "demo-qr-token",
      approvedAt: new Date(), approvedBy: "demo-superadmin",
      createdAt: new Date(), updatedAt: new Date(),
    },
  },
  departments: {
    "demo-dept-dahiliye": {
      name: "Dahiliye", hospitalId: "demo-hospital", createdAt: new Date(),
    },
    "demo-dept-kardiyoloji": {
      name: "Kardiyoloji", hospitalId: "demo-hospital", createdAt: new Date(),
    },
  },
  doctors: {
    "demo-doctor-profile": {
      userId: "demo-doctor", hospitalId: "demo-hospital",
      departmentId: "demo-dept-dahiliye", departmentName: "Dahiliye",
      title: "Uzm. Dr.", specialization: "İç Hastalıkları", roomNumber: "201",
      dailyQuota: 30, isAvailable: true,
      workingHours: {
        monday: { start: "09:00", end: "17:00", slotMinutes: 15 },
        tuesday: { start: "09:00", end: "17:00", slotMinutes: 15 },
        wednesday: { start: "09:00", end: "17:00", slotMinutes: 15 },
        thursday: { start: "09:00", end: "17:00", slotMinutes: 15 },
        friday: { start: "09:00", end: "13:00", slotMinutes: 15 },
        saturday: null, sunday: null,
      },
      createdAt: new Date(), updatedAt: new Date(),
    },
  },
  appointments: {},
  queueSessions: {},
  queueEntries: {},
  scheduleBlocks: {},
  notifications: {},
};

let docCounter = 0;
function genId(): string {
  return `demo-${Date.now()}-${++docCounter}`;
}

// ==================== Demo Firestore Wrapper ====================

class DemoDocRef {
  constructor(private collectionName: string, private docId: string) {}

  async get() {
    const data = demoStore[this.collectionName]?.[this.docId];
    return {
      exists: !!data,
      id: this.docId,
      data: () => data ? { ...data } : undefined,
      ref: this,
    };
  }

  async set(data: any) {
    if (!demoStore[this.collectionName]) demoStore[this.collectionName] = {};
    demoStore[this.collectionName][this.docId] = { ...data };
  }

  async update(data: any) {
    if (demoStore[this.collectionName]?.[this.docId]) {
      demoStore[this.collectionName][this.docId] = {
        ...demoStore[this.collectionName][this.docId],
        ...data,
      };
    }
  }

  async delete() {
    delete demoStore[this.collectionName]?.[this.docId];
  }
}

class DemoQuery {
  private filters: Array<{ field: string; op: string; value: any }> = [];
  private orderByField: string | null = null;
  private orderDir: string = "asc";
  private limitCount: number | null = null;

  constructor(private collectionName: string) {}

  where(field: string, op: string, value: any) {
    this.filters.push({ field, op, value });
    return this;
  }

  orderBy(field: string, dir: string = "asc") {
    this.orderByField = field;
    this.orderDir = dir;
    return this;
  }

  limit(n: number) {
    this.limitCount = n;
    return this;
  }

  async count() {
    const result = await this.get();
    return { data: () => ({ count: result.size }) };
  }

  async get() {
    const store = demoStore[this.collectionName] || {};
    let docs = Object.entries(store).map(([id, data]) => ({
      id,
      ref: new DemoDocRef(this.collectionName, id),
      data: () => ({ ...data }),
      exists: true,
    }));

    // Apply filters
    for (const f of this.filters) {
      docs = docs.filter((doc) => {
        const val = doc.data()[f.field];
        switch (f.op) {
          case "==": return val === f.value;
          case "!=": return val !== f.value;
          case ">": return val > f.value;
          case "<": return val < f.value;
          case ">=": return val >= f.value;
          case "<=": return val <= f.value;
          case "in": return Array.isArray(f.value) && f.value.includes(val);
          case "not-in": return Array.isArray(f.value) && !f.value.includes(val);
          default: return true;
        }
      });
    }

    // Apply orderBy
    if (this.orderByField) {
      const field = this.orderByField;
      const dir = this.orderDir;
      docs.sort((a, b) => {
        const aVal = a.data()[field];
        const bVal = b.data()[field];
        if (aVal < bVal) return dir === "asc" ? -1 : 1;
        if (aVal > bVal) return dir === "asc" ? 1 : -1;
        return 0;
      });
    }

    // Apply limit
    if (this.limitCount) {
      docs = docs.slice(0, this.limitCount);
    }

    return {
      docs,
      empty: docs.length === 0,
      size: docs.length,
    };
  }
}

class DemoCollection {
  constructor(private name: string) {}

  doc(id?: string) {
    const docId = id || genId();
    return new DemoDocRef(this.name, docId);
  }

  where(field: string, op: string, value: any) {
    return new DemoQuery(this.name).where(field, op, value);
  }

  orderBy(field: string, dir: string = "asc") {
    return new DemoQuery(this.name).orderBy(field, dir);
  }

  async count() {
    return new DemoQuery(this.name).count();
  }

  async add(data: any) {
    const id = genId();
    if (!demoStore[this.name]) demoStore[this.name] = {};
    demoStore[this.name][id] = { ...data };
    return { id };
  }
}

class DemoBatch {
  private ops: Array<() => void> = [];

  set(ref: DemoDocRef, data: any) {
    this.ops.push(() => ref.set(data));
  }

  update(ref: DemoDocRef, data: any) {
    this.ops.push(() => ref.update(data));
  }

  delete(ref: DemoDocRef) {
    this.ops.push(() => ref.delete());
  }

  async commit() {
    for (const op of this.ops) await op();
  }
}

const demoDb = {
  collection: (name: string) => new DemoCollection(name),
  batch: () => new DemoBatch(),
};

const demoAuth = {
  verifyIdToken: async (token: string) => {
    // Token = demo user ID
    return { uid: token, phone_number: null, email: null };
  },
  createUser: async (data: any) => {
    const uid = genId();
    return { uid, email: data.email };
  },
  setCustomUserClaims: async () => {},
};

const demoMessaging = {
  sendEachForMulticast: async () => ({ successCount: 0, failureCount: 0 }),
};

// ==================== Exports ====================

if (DEMO_MODE) {
  console.log("🔶 DEMO_MODE: Firebase Admin SDK devre dışı, in-memory store kullanılıyor");
}

let _realApp: any;
let _realAuth: any;
let _realDb: any;
let _realMessaging: any;

function getRealApp() {
  if (!_realApp) {
    const { initializeApp, getApps, cert } = require("firebase-admin/app");
    if (getApps().length === 0) {
      _realApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    } else {
      _realApp = getApps()[0];
    }
  }
  return _realApp;
}

export const adminAuth: any = DEMO_MODE
  ? demoAuth
  : new Proxy({} as any, { get(_, prop) { if (!_realAuth) { const { getAuth } = require("firebase-admin/auth"); _realAuth = getAuth(getRealApp()); } return _realAuth[prop]; } });

export const adminDb: any = DEMO_MODE
  ? demoDb
  : new Proxy({} as any, { get(_, prop) { if (!_realDb) { const { getFirestore } = require("firebase-admin/firestore"); _realDb = getFirestore(getRealApp()); } return _realDb[prop]; } });

export const adminMessaging: any = DEMO_MODE
  ? demoMessaging
  : new Proxy({} as any, { get(_, prop) { if (!_realMessaging) { const { getMessaging } = require("firebase-admin/messaging"); _realMessaging = getMessaging(getRealApp()); } return _realMessaging[prop]; } });

export { DEMO_MODE };
