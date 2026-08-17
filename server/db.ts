import { asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertPortalDecision,
  InsertPortalMember,
  InsertUser,
  portalDecisions,
  portalMembers,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  textFields.forEach(field => {
    const value = user[field];
    if (value === undefined) return;
    values[field] = value ?? null;
    updateSet[field] = value ?? null;
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getPortalMemberByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(portalMembers)
    .where(eq(portalMembers.email, email.toLowerCase()))
    .limit(1);
  return result[0];
}

export async function listPortalMembers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(portalMembers).orderBy(asc(portalMembers.seatNumber));
}

export async function savePortalMember(member: InsertPortalMember) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const email = member.email.toLowerCase();
  const existing = await getPortalMemberByEmail(email);
  const members = await listPortalMembers();

  if (!existing && members.length >= 3) {
    throw new Error("All three NMS decision-maker seats are already allocated");
  }

  const seatNumber = existing?.seatNumber ?? member.seatNumber;
  await db
    .insert(portalMembers)
    .values({ ...member, email, seatNumber })
    .onDuplicateKeyUpdate({
      set: {
        name: member.name ?? null,
        title: member.title ?? null,
        status: member.status ?? "invited",
        seatNumber,
      },
    });
  return getPortalMemberByEmail(email);
}

export async function removePortalMember(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(portalMembers).where(eq(portalMembers.id, id));
}

export async function activatePortalMember(email: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(portalMembers)
    .set({ status: "active", lastViewedAt: new Date() })
    .where(eq(portalMembers.email, email.toLowerCase()));
}

export async function listPortalDecisions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(portalDecisions).orderBy(asc(portalDecisions.area));
}

export async function savePortalDecision(decision: InsertPortalDecision) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(portalDecisions).values(decision).onDuplicateKeyUpdate({
    set: {
      selection: decision.selection,
      note: decision.note ?? null,
      status: decision.status ?? "draft",
    },
  });
  return listPortalDecisions();
}
