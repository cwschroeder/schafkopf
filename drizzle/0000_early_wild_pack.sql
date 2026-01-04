CREATE TABLE "feedback_reports" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"user_id" varchar(32) NOT NULL,
	"user_name" varchar(100) NOT NULL,
	"user_email" varchar(255),
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(20),
	"priority" varchar(20),
	"severity" varchar(20),
	"ai_summary" text,
	"duplicate_of" varchar(32),
	"duplicate_confidence" real,
	"suggested_labels" text[],
	"context" jsonb NOT NULL,
	"github_issue_number" integer,
	"github_issue_url" text,
	"github_exported_at" timestamp with time zone,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"resolved_in_version" varchar(20),
	"resolution_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"exported_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"notified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "feedback_screenshots" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"report_id" varchar(32) NOT NULL,
	"filename" varchar(255) NOT NULL,
	"mime_type" varchar(50) NOT NULL,
	"size" integer NOT NULL,
	"annotations" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" varchar(32) NOT NULL,
	"room_id" varchar(32) NOT NULL,
	"played_at" timestamp with time zone DEFAULT now() NOT NULL,
	"spielart" varchar(50) NOT NULL,
	"spielmacher_id" varchar(32) NOT NULL,
	"partner_id" varchar(32),
	"spieler_partei" text[] NOT NULL,
	"gegner_partei" text[] NOT NULL,
	"punkte" integer NOT NULL,
	"gewonnen" boolean NOT NULL,
	"schneider" boolean DEFAULT false NOT NULL,
	"schwarz" boolean DEFAULT false NOT NULL,
	"laufende" integer DEFAULT 0 NOT NULL,
	"guthaben_aenderung" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legacy_player_links" (
	"legacy_player_id" varchar(32) PRIMARY KEY NOT NULL,
	"user_id" varchar(32) NOT NULL,
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(32) NOT NULL,
	"provider" varchar(20) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_stats" (
	"user_id" varchar(32) PRIMARY KEY NOT NULL,
	"guthaben" integer DEFAULT 0 NOT NULL,
	"spiele_gesamt" integer DEFAULT 0 NOT NULL,
	"siege" integer DEFAULT 0 NOT NULL,
	"niederlagen" integer DEFAULT 0 NOT NULL,
	"ansagen_count" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ansagen_wins" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"weekly_guthaben" integer DEFAULT 0 NOT NULL,
	"monthly_guthaben" integer DEFAULT 0 NOT NULL,
	"weekly_reset_at" date DEFAULT now() NOT NULL,
	"monthly_reset_at" date DEFAULT now() NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone DEFAULT now() NOT NULL,
	"settings" jsonb DEFAULT '{"voicePreference":"male","darkMode":false,"cardDesign":"bavarian","audioVolume":80,"soundEffectsEnabled":true,"speechEnabled":true}'::jsonb NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "feedback_screenshots" ADD CONSTRAINT "feedback_screenshots_report_id_feedback_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."feedback_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legacy_player_links" ADD CONSTRAINT "legacy_player_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_feedback_user" ON "feedback_reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_feedback_status" ON "feedback_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_feedback_created" ON "feedback_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_screenshots_report" ON "feedback_screenshots" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "idx_games_spielmacher" ON "game_results" USING btree ("spielmacher_id");--> statement-breakpoint
CREATE INDEX "idx_games_played_at" ON "game_results" USING btree ("played_at");--> statement-breakpoint
CREATE INDEX "idx_games_room" ON "game_results" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "idx_legacy_user" ON "legacy_player_links" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_oauth_user" ON "oauth_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_oauth_provider" ON "oauth_accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "idx_stats_guthaben" ON "user_stats" USING btree ("guthaben");--> statement-breakpoint
CREATE INDEX "idx_stats_weekly" ON "user_stats" USING btree ("weekly_guthaben");--> statement-breakpoint
CREATE INDEX "idx_stats_monthly" ON "user_stats" USING btree ("monthly_guthaben");--> statement-breakpoint
CREATE INDEX "idx_stats_siege" ON "user_stats" USING btree ("siege");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_last_login" ON "users" USING btree ("last_login_at");