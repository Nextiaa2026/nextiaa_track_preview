-- Migration: Add trips, trip_logs tables; add chassis_number and trip_id to shipments; remove vessel_id from shipments; remove status from vessels

-- 1. Create trips table
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

-- 2. Create trip_logs table
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

-- 3. Add chassis_number to shipments (nullable first, then we'll set a default and make NOT NULL)
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "chassis_number" varchar(100);
--> statement-breakpoint

-- 4. Backfill chassis_number with tracking_number for existing rows
UPDATE "shipments" SET "chassis_number" = "tracking_number" WHERE "chassis_number" IS NULL;
--> statement-breakpoint

-- 5. Make chassis_number NOT NULL and UNIQUE
ALTER TABLE "shipments" ALTER COLUMN "chassis_number" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT IF NOT EXISTS "shipments_chassis_number_unique" UNIQUE("chassis_number");
--> statement-breakpoint

-- 6. Add trip_id to shipments
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "trip_id" uuid;
--> statement-breakpoint

-- 7. Remove vessel_id from shipments (vessel is now accessed via trip)
ALTER TABLE "shipments" DROP COLUMN IF EXISTS "vessel_id";
--> statement-breakpoint

-- 8. Remove status from vessels (status is now on trips)
ALTER TABLE "vessels" DROP COLUMN IF EXISTS "status";
--> statement-breakpoint

-- 9. Drop old shipment_logs table (replaced by trip_logs)
DROP TABLE IF EXISTS "shipment_logs" CASCADE;
--> statement-breakpoint

-- 10. Add foreign keys
DO $$ BEGIN
  ALTER TABLE "trips" ADD CONSTRAINT "trips_vessel_id_vessels_id_fk"
    FOREIGN KEY ("vessel_id") REFERENCES "vessels"("id") ON DELETE SET NULL ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "trip_logs" ADD CONSTRAINT "trip_logs_trip_id_trips_id_fk"
    FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "shipments" ADD CONSTRAINT "shipments_trip_id_trips_id_fk"
    FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
