CREATE TABLE IF NOT EXISTS "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" varchar(42),
	"action" varchar(50) NOT NULL,
	"details" jsonb,
	"ip_address" "inet",
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ens_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" varchar(42) NOT NULL,
	"ens_name" varchar(255) NOT NULL,
	"chain_id" integer NOT NULL,
	"tx_hash" varchar(66),
	"registered_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone,
	CONSTRAINT "ens_registrations_address_unique" UNIQUE("address")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nickname_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nickname_normalized" varchar(32) NOT NULL,
	"address" varchar(42) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "nickname_reservations_nickname_normalized_unique" UNIQUE("nickname_normalized")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" varchar(42) NOT NULL,
	"nickname" varchar(32),
	"nickname_normalized" varchar(32),
	"avatar_style" varchar(20) DEFAULT 'bottts',
	"avatar_seed" varchar(64),
	"avatar_gender" varchar(10),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "profiles_address_unique" UNIQUE("address"),
	CONSTRAINT "profiles_nickname_unique" UNIQUE("nickname"),
	CONSTRAINT "profiles_nickname_normalized_unique" UNIQUE("nickname_normalized")
);
