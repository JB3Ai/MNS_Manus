import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const portalMembers = mysqlTable("portal_members", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 160 }),
  title: varchar("title", { length: 160 }),
  seatNumber: int("seatNumber").notNull(),
  role: mysqlEnum("memberRole", ["decision_maker"]).default("decision_maker").notNull(),
  status: mysqlEnum("memberStatus", ["invited", "active"]).default("invited").notNull(),
  invitedByUserId: int("invitedByUserId").references(() => users.id, { onDelete: "set null" }),
  lastViewedAt: timestamp("lastViewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const portalDecisions = mysqlTable(
  "portal_decisions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    area: varchar("area", { length: 80 }).notNull(),
    selection: varchar("selection", { length: 240 }).notNull(),
    note: text("note"),
    status: mysqlEnum("decisionStatus", ["draft", "approved", "needs_discussion"])
      .default("draft")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("decision_user_area_unique").on(table.userId, table.area)],
);

export const documentReviews = mysqlTable(
  "document_reviews",
  {
    id: int("id").autoincrement().primaryKey(),
    reviewerId: varchar("reviewerId", { length: 64 }).notNull(),
    reviewerName: varchar("reviewerName", { length: 160 }).notNull(),
    documentId: varchar("documentId", { length: 100 }).notNull(),
    openedAt: timestamp("openedAt"),
    downloadedAt: timestamp("downloadedAt"),
    readAt: timestamp("readAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("document_reviewer_unique").on(table.reviewerId, table.documentId)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type PortalMember = typeof portalMembers.$inferSelect;
export type InsertPortalMember = typeof portalMembers.$inferInsert;
export type PortalDecision = typeof portalDecisions.$inferSelect;
export type InsertPortalDecision = typeof portalDecisions.$inferInsert;
export type DocumentReview = typeof documentReviews.$inferSelect;
export type InsertDocumentReview = typeof documentReviews.$inferInsert;
