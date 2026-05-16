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

// ─── App Settings ─────────────────────────────────────────────────────────────
// Key/value store for per-user application settings.

export const appSettings = pgTable("app_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  key: varchar("key", { length: 100 }).notNull(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Trips ────────────────────────────────────────────────────────────────────
// A trip groups shipments under a vessel for a given voyage.
// Vessel association is optional — trips can exist without a vessel.
// When a trip status is toggled, all associated shipments inherit that status.

export const trips = pgTable("trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  vesselId: uuid("vessel_id").references(() => vessels.id, { onDelete: "set null" }),
  origin: varchar("origin", { length: 255 }),
  destination: varchar("destination", { length: 255 }),
  departureDate: timestamp("departure_date"),
  arrivalDate: timestamp("arrival_date"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Trip Logs ────────────────────────────────────────────────────────────────
// Activity timeline belongs to the trip, not individual shipments.

export const tripLogs = pgTable("trip_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).notNull(),
  location: varchar("location", { length: 255 }),
  address: text("address"),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Shipments ────────────────────────────────────────────────────────────────
// chassisNumber is required and used as a unique index / search key.
// Vessel is accessed via trip — no direct vessel FK on shipments.

export const shipments = pgTable("shipments", {
  id: uuid("id").primaryKey().defaultRandom(),
  trackingNumber: varchar("tracking_number", { length: 100 }).notNull().unique(),
  chassisNumber: varchar("chassis_number", { length: 100 }).notNull().unique(),
  senderId: uuid("sender_id").notNull().references(() => customers.id),
  receiverId: uuid("receiver_id").notNull().references(() => customers.id),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "set null" }),
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
  trips: many(trips),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  vessel: one(vessels, { fields: [trips.vesselId], references: [vessels.id] }),
  shipments: many(shipments),
  logs: many(tripLogs),
}));

export const tripLogsRelations = relations(tripLogs, ({ one }) => ({
  trip: one(trips, {
    fields: [tripLogs.tripId],
    references: [trips.id],
  }),
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
  trip: one(trips, { fields: [shipments.tripId], references: [trips.id] }),
  invoices: many(invoices),
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
