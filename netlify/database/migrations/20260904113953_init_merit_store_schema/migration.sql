CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"username" text NOT NULL UNIQUE,
	"password_hash" text NOT NULL,
	"password_salt" text NOT NULL,
	"role" text DEFAULT 'staff' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cadets" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prices" (
	"id" integer PRIMARY KEY,
	"phone_price" integer DEFAULT 10 NOT NULL,
	"food_delivery_price" integer DEFAULT 10 NOT NULL,
	"group_food_delivery_price" integer DEFAULT 15 NOT NULL,
	"liberty_price" integer DEFAULT 20 NOT NULL,
	"reduce_ed_merits_per_ed" integer DEFAULT 2 NOT NULL,
	"offset_demerits_merits_per_demerit" integer DEFAULT 2 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_settings" (
	"id" integer PRIMARY KEY,
	"enabled" boolean DEFAULT false NOT NULL,
	"session_date" date,
	"open_time" text,
	"close_time" text,
	"allowed_privileges" jsonb DEFAULT '["phone","food_delivery","group_food_delivery","liberty","reduce_ed","offset_demerits"]' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_counter" (
	"id" integer PRIMARY KEY,
	"value" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY,
	"transaction_code" text NOT NULL UNIQUE,
	"cadet_id" integer,
	"cadet_name" text NOT NULL,
	"privilege" text NOT NULL,
	"privilege_type" text NOT NULL,
	"quantity" integer,
	"quantity_type" text,
	"conversion_rate" integer,
	"merit_cost" integer NOT NULL,
	"availment_date" date NOT NULL,
	"confirmation_date" date,
	"status" text DEFAULT 'Pending' NOT NULL,
	"merits_deducted" integer DEFAULT 0 NOT NULL,
	"violation" boolean DEFAULT false NOT NULL,
	"remarks" text,
	"source" text NOT NULL,
	"created_by_account_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_cadet_id_cadets_id_fkey" FOREIGN KEY ("cadet_id") REFERENCES "cadets"("id");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_by_account_id_accounts_id_fkey" FOREIGN KEY ("created_by_account_id") REFERENCES "accounts"("id");