CREATE TABLE IF NOT EXISTS "trip_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"status" varchar(50) NOT NULL,
	"location" varchar(255),
	"address" text,
	"message" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"vessel_id" uuid,
	"origin" varchar(255),
	"destination" varchar(255),
	"departure_date" timestamp,
	"arrival_date" timestamp,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "shipment_logs";--> statement-breakpoint
ALTER TABLE "shipments" DROP CONSTRAINT "shipments_vessel_id_vessels_id_fk";
--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "shipment_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "sender_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "receiver_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "shipments" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "shipments" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "shipments" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "shipments" ALTER COLUMN "sender_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "shipments" ALTER COLUMN "receiver_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "vessels" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "vessels" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "vessels" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "chassis_number" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "trip_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trip_logs" ADD CONSTRAINT "trip_logs_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trips" ADD CONSTRAINT "trips_vessel_id_vessels_id_fk" FOREIGN KEY ("vessel_id") REFERENCES "public"."vessels"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shipments" ADD CONSTRAINT "shipments_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "shipments" DROP COLUMN IF EXISTS "vessel_id";--> statement-breakpoint
ALTER TABLE "vessels" DROP COLUMN IF EXISTS "status";--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_chassis_number_unique" UNIQUE("chassis_number");