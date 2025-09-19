CREATE TABLE "ai_decisions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"correlation_id" text NOT NULL,
	"stage" text NOT NULL,
	"input" jsonb,
	"output" jsonb,
	"confidence" numeric(5, 2),
	"processing_time_ms" integer,
	"status" text NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"correlation_id" text,
	"event_type" text NOT NULL,
	"event_data" jsonb,
	"user_id" varchar,
	"timestamp" timestamp DEFAULT now(),
	"source" text,
	"level" text DEFAULT 'info'
);
--> statement-breakpoint
CREATE TABLE "portfolios" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"total_value" numeric(15, 2) NOT NULL,
	"cash_balance" numeric(15, 2) NOT NULL,
	"day_pnl" numeric(15, 2) DEFAULT '0',
	"total_pnl" numeric(15, 2) DEFAULT '0',
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portfolio_id" varchar,
	"symbol" text NOT NULL,
	"quantity" integer NOT NULL,
	"entry_price" numeric(10, 4) NOT NULL,
	"current_price" numeric(10, 4),
	"market_value" numeric(15, 2),
	"unrealized_pnl" numeric(15, 2),
	"is_open" boolean DEFAULT true,
	"entry_date" timestamp DEFAULT now(),
	"exit_date" timestamp,
	"exit_price" numeric(10, 4),
	"realized_pnl" numeric(15, 2),
	"strategy_id" text,
	"correlation_id" text
);
--> statement-breakpoint
CREATE TABLE "strategies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"entry_rules" text NOT NULL,
	"exit_rules" text NOT NULL,
	"risk_parameters" jsonb,
	"backtest_results" jsonb,
	"confidence" numeric(5, 2),
	"status" text DEFAULT 'staged',
	"created_at" timestamp DEFAULT now(),
	"correlation_id" text,
	"ai_metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "system_health" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service" text NOT NULL,
	"status" text NOT NULL,
	"metrics" jsonb,
	"last_check" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portfolio_id" varchar,
	"position_id" varchar,
	"symbol" text NOT NULL,
	"side" text NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(10, 4) NOT NULL,
	"executed_at" timestamp DEFAULT now(),
	"order_id" text,
	"correlation_id" text,
	"strategy_name" text,
	"ai_reasoning" text
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"alpaca_api_key" text,
	"alpaca_secret_key" text,
	"gemini_api_key" text,
	"enable_paper_trading" boolean DEFAULT true,
	"enable_real_trading" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;