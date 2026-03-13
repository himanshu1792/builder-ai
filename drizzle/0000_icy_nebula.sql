CREATE TABLE "agents" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"application_id" varchar(21) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"system_prompt" text NOT NULL,
	"task_prompt" text NOT NULL,
	"output_schema" jsonb,
	"model" varchar(50) DEFAULT 'gpt-4o-mini' NOT NULL,
	"temperature" real DEFAULT 0.7,
	"prompt_placeholders" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agents_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "execution_logs" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"agent_id" varchar(21),
	"orchestration_id" varchar(21),
	"orchestration_run_id" varchar(24),
	"step_order" integer,
	"input_payload" jsonb NOT NULL,
	"output_payload" jsonb,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"model" varchar(50),
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"total_tokens" integer,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_pricing" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"model_id" varchar(50) NOT NULL,
	"display_name" text NOT NULL,
	"input_price_per_1k" numeric(10, 6) NOT NULL,
	"output_price_per_1k" numeric(10, 6) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"effective_date" date DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "model_pricing_model_id_unique" UNIQUE("model_id")
);
--> statement-breakpoint
CREATE TABLE "orchestration_steps" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"orchestration_id" varchar(21) NOT NULL,
	"agent_id" varchar(21) NOT NULL,
	"step_order" integer NOT NULL,
	"input_mapping" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orchestration_step_order_unique" UNIQUE("orchestration_id","step_order")
);
--> statement-breakpoint
CREATE TABLE "orchestrations" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"application_id" varchar(21) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orchestrations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_logs" ADD CONSTRAINT "execution_logs_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_logs" ADD CONSTRAINT "execution_logs_orchestration_id_orchestrations_id_fk" FOREIGN KEY ("orchestration_id") REFERENCES "public"."orchestrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orchestration_steps" ADD CONSTRAINT "orchestration_steps_orchestration_id_orchestrations_id_fk" FOREIGN KEY ("orchestration_id") REFERENCES "public"."orchestrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orchestration_steps" ADD CONSTRAINT "orchestration_steps_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orchestrations" ADD CONSTRAINT "orchestrations_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;