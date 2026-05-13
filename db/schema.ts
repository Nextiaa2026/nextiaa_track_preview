import {
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
  doublePrecision,
  integer,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Auth Table ─────────────────────────────────────────────────────────────
// Only one user (admin) will exist in this system.

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 50 }).notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Customers ────────────────────────────────────────────────────────────────

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }).notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  zipCode: varchar("zip_code", { length: 20 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  locality: varchar("locality", { length: 500 }),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Vessels ──────────────────────────────────────────────────────────────────

export const vessels = pgTable("vessels", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  imo: varchar("imo", { length: 100 }).notNull().unique(),
  type: varchar("type", { length: 100 }).notNull().default("cargo"),
  lastKnownLat: doublePrecision("last_known_lat"),
  lastKnownLon: doublePrecision("last_known_lon"),
  isActive: boolean("is_active").notNull().default(true),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Shipments ────────────────────────────────────────────────────────────────

export const shipments = pgTable("shipments", {
  id: uuid("id").primaryKey().defaultRandom(),
  trackingNumber: varchar("tracking_number", { length: 100 }).notNull().unique(),
  senderId: uuid("sender_id").notNull().references(() => customers.id),
  receiverId: uuid("receiver_id").notNull().references(() => customers.id),
  vesselId: uuid("vessel_id").references(() => vessels.id),
  shipmentType: varchar("shipment_type", { length: 50 }).notNull().default("international"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  itemDescription: text("item_description"),
  itemWeight: varchar("item_weight", { length: 50 }),
  itemDimensions: varchar("item_dimensions", { length: 100 }),
  itemImage: text("item_image"),
  shippingCost: integer("shipping_cost").notNull(),
  estimatedDelivery: timestamp("estimated_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Shipment Logs ────────────────────────────────────────────────────────────

export const shipmentLogs = pgTable("shipment_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  shipmentId: uuid("shipment_id")
    .notNull()
    .references(() => shipments.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).notNull(),
  location: varchar("location", { length: 255 }),
  address: text("address"),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Invoices ─────────────────────────────────────────────────────────────────

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull().unique(),
  shipmentId: uuid("shipment_id")
    .notNull()
    .references(() => shipments.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").notNull().references(() => customers.id),
  receiverId: uuid("receiver_id").notNull().references(() => customers.id),
  currency: varchar("currency", { length: 10 }).notNull().default("USD"),
  subtotal: integer("subtotal").notNull(),
  taxAmount: integer("tax_amount").notNull().default(0),
  totalAmount: integer("total_amount").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("issued"),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const customersRelations = relations(customers, ({ many }) => ({
  sentShipments: many(shipments, { relationName: "sender" }),
  receivedShipments: many(shipments, { relationName: "receiver" }),
  sentInvoices: many(invoices, { relationName: "invoiceSender" }),
  receivedInvoices: many(invoices, { relationName: "invoiceReceiver" }),
}));

export const vesselsRelations = relations(vessels, ({ many }) => ({
  shipments: many(shipments),
}));

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  sender: one(customers, {
    fields: [shipments.senderId],
    references: [customers.id],
    relationName: "sender",
  }),
  receiver: one(customers, {
    fields: [shipments.receiverId],
    references: [customers.id],
    relationName: "receiver",
  }),
  vessel: one(vessels, { fields: [shipments.vesselId], references: [vessels.id] }),
  logs: many(shipmentLogs),
  invoices: many(invoices),
}));

export const shipmentLogsRelations = relations(shipmentLogs, ({ one }) => ({
  shipment: one(shipments, {
    fields: [shipmentLogs.shipmentId],
    references: [shipments.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  shipment: one(shipments, { fields: [invoices.shipmentId], references: [shipments.id] }),
  sender: one(customers, {
    fields: [invoices.senderId],
    references: [customers.id],
    relationName: "invoiceSender",
  }),
  receiver: one(customers, {
    fields: [invoices.receiverId],
    references: [customers.id],
    relationName: "invoiceReceiver",
  }),
}));
