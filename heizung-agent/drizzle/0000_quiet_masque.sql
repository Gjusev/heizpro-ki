CREATE TABLE "heizpro"."agent_scripts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar(50) NOT NULL,
	"script_id" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "heizpro"."agents" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"personality" varchar(30) DEFAULT 'beratend' NOT NULL,
	"language" varchar(10) DEFAULT 'de-DE' NOT NULL,
	"voice_id" varchar(100),
	"engine_id" varchar(100),
	"speed" real DEFAULT 1 NOT NULL,
	"temperature" integer DEFAULT 70 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"max_calls_per_day" integer DEFAULT 80 NOT NULL,
	"work_start" varchar(5) DEFAULT '09:00' NOT NULL,
	"work_end" varchar(5) DEFAULT '18:00' NOT NULL,
	"work_days" varchar(20) DEFAULT '1,2,3,4,5' NOT NULL,
	"niches" text DEFAULT 'waermepumpe,klimaanlage,gasheizung' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "heizpro"."calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar(50),
	"script_id" varchar(100),
	"niche" varchar(50),
	"status" varchar(30) DEFAULT 'abgeschlossen' NOT NULL,
	"outcome" varchar(30),
	"mood" varchar(20),
	"duration" integer DEFAULT 0 NOT NULL,
	"summary" text,
	"transcript" jsonb DEFAULT '[]' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "heizpro"."scripts" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"niche" varchar(50) NOT NULL,
	"description" text,
	"version" varchar(10) DEFAULT '1.0' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sections" jsonb DEFAULT '[]' NOT NULL,
	"objections" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "heizpro"."speech_engines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"engine_id" varchar(100) NOT NULL,
	"ws_url" varchar(500),
	"voice_id" varchar(100),
	"model_id" varchar(100) DEFAULT 'eleven_multilingual_v2',
	"active" boolean DEFAULT true NOT NULL,
	"config" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "heizpro"."agent_scripts" ADD CONSTRAINT "agent_scripts_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "heizpro"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heizpro"."agent_scripts" ADD CONSTRAINT "agent_scripts_script_id_scripts_id_fk" FOREIGN KEY ("script_id") REFERENCES "heizpro"."scripts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heizpro"."calls" ADD CONSTRAINT "calls_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "heizpro"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heizpro"."calls" ADD CONSTRAINT "calls_script_id_scripts_id_fk" FOREIGN KEY ("script_id") REFERENCES "heizpro"."scripts"("id") ON DELETE no action ON UPDATE no action;