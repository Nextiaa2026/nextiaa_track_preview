CREATE TABLE IF NOT EXISTS "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"invoice_id" uuid,
	"amount" varchar(100) NOT NULL,
	"reason" varchar(255) DEFAULT 'acompte' NOT NULL,
	"paid_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"download_token" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_download_token_unique" UNIQUE("download_token")
);
--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "currency" SET DEFAULT 'EUR';--> statement-breakpoint
ALTER TABLE "shipments" ALTER COLUMN "shipping_cost" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "shipments" ALTER COLUMN "shipping_cost" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "download_token" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "vessels" ADD COLUMN "carrier_name" varchar(255) DEFAULT '' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_download_token_unique" UNIQUE("download_token");