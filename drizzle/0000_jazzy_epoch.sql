CREATE TYPE "public"."consumer_type_enum" AS ENUM('Company', 'Employee');--> statement-breakpoint
CREATE TYPE "public"."contract_status_enum" AS ENUM('HieuLuc', 'HetHan', 'HuyBo');--> statement-breakpoint
CREATE TYPE "public"."gender_enum" AS ENUM('Nam', 'Nữ', 'Khác');--> statement-breakpoint
CREATE TYPE "public"."invoice_status_enum" AS ENUM('ChuaThanhToan', 'DaThanhToan', 'QuaHan');--> statement-breakpoint
CREATE TYPE "public"."staff_role_enum" AS ENUM('QuanLy', 'NhanVien');--> statement-breakpoint
CREATE TABLE "invoice" (
	"invoice_id" varchar(50) PRIMARY KEY NOT NULL,
	"company_id" varchar(50) NOT NULL,
	"billing_month" integer NOT NULL,
	"billing_year" integer NOT NULL,
	"invoice_date" date NOT NULL,
	"due_date" date NOT NULL,
	"total_amount" numeric(18, 2) DEFAULT '0',
	"invoice_status" "invoice_status_enum" DEFAULT 'ChuaThanhToan' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "invoice_detail" (
	"invoice_id" varchar(50) NOT NULL,
	"detail_id" varchar(50) NOT NULL,
	"service_id" varchar(50) NOT NULL,
	"date" date NOT NULL,
	"description" varchar(255),
	"quantity" numeric(10, 2) NOT NULL,
	"subtotal" numeric(18, 2) NOT NULL,
	CONSTRAINT "invoice_detail_invoice_id_detail_id_pk" PRIMARY KEY("invoice_id","detail_id")
);
--> statement-breakpoint
CREATE TABLE "usage_log" (
	"service_id" varchar(50) NOT NULL,
	"consumer_id" varchar(50) NOT NULL,
	"usage_start" timestamp with time zone NOT NULL,
	"usage_end" timestamp with time zone,
	"unit_price_snapshot" numeric(18, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usage_log_service_id_consumer_id_usage_start_pk" PRIMARY KEY("service_id","consumer_id","usage_start")
);
--> statement-breakpoint
CREATE TABLE "office" (
	"office_id" varchar(50) PRIMARY KEY NOT NULL,
	"floor" integer NOT NULL,
	"room" varchar(50) NOT NULL,
	"location" varchar(255),
	"area" numeric(10, 2) NOT NULL,
	"unit_price" numeric(18, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "company" (
	"consumer_id" varchar(50) NOT NULL,
	"company_id" varchar(50) PRIMARY KEY NOT NULL,
	"tax_code" varchar(50) NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"phone_no" varchar(20)[],
	"email" varchar(100),
	"total_rent_area" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "company_consumer_id_unique" UNIQUE("consumer_id"),
	CONSTRAINT "company_tax_code_unique" UNIQUE("tax_code")
);
--> statement-breakpoint
CREATE TABLE "employee" (
	"consumer_id" varchar(50) NOT NULL,
	"company_id" varchar(50) NOT NULL,
	"employee_id" varchar(50) NOT NULL,
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50) NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"email" varchar(100),
	"status" varchar(50),
	"license_plate" varchar(20)[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "employee_company_id_employee_id_pk" PRIMARY KEY("company_id","employee_id"),
	CONSTRAINT "employee_consumer_id_unique" UNIQUE("consumer_id")
);
--> statement-breakpoint
CREATE TABLE "service_consumer" (
	"consumer_id" varchar(50) PRIMARY KEY NOT NULL,
	"consumer_type" "consumer_type_enum" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_contract" (
	"company_id" varchar(50) NOT NULL,
	"office_id" varchar(50) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"rent_price" numeric(18, 2) NOT NULL,
	"status" "contract_status_enum" DEFAULT 'HieuLuc' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "company_contract_company_id_office_id_start_date_pk" PRIMARY KEY("company_id","office_id","start_date")
);
--> statement-breakpoint
CREATE TABLE "area_based" (
	"service_id" varchar(50) NOT NULL,
	"policy_id" varchar(50) NOT NULL,
	"area_from" numeric(10, 2) NOT NULL,
	"area_to" numeric(10, 2),
	CONSTRAINT "area_based_service_id_policy_id_pk" PRIMARY KEY("service_id","policy_id")
);
--> statement-breakpoint
CREATE TABLE "headcount_based" (
	"service_id" varchar(50) NOT NULL,
	"policy_id" varchar(50) NOT NULL,
	"people_from" integer NOT NULL,
	"people_to" integer,
	CONSTRAINT "headcount_based_service_id_policy_id_pk" PRIMARY KEY("service_id","policy_id")
);
--> statement-breakpoint
CREATE TABLE "pricing_policy" (
	"service_id" varchar(50) NOT NULL,
	"policy_id" varchar(50) NOT NULL,
	"base_price" numeric(18, 2) NOT NULL,
	"increase_percentage" numeric(5, 2) NOT NULL,
	"policy_type" varchar(50) NOT NULL,
	CONSTRAINT "pricing_policy_service_id_policy_id_pk" PRIMARY KEY("service_id","policy_id")
);
--> statement-breakpoint
CREATE TABLE "service" (
	"service_id" varchar(50) PRIMARY KEY NOT NULL,
	"service_name" varchar(255) NOT NULL,
	"service_type" varchar(50) NOT NULL,
	"unit_measurement" varchar(50),
	"service_revenue" numeric(18, 2) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "building_staff" (
	"staff_id" varchar(50) PRIMARY KEY NOT NULL,
	"manager_id" varchar(50),
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50) NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"dob" date NOT NULL,
	"gender" "gender_enum" NOT NULL,
	"phone" varchar(20)[],
	"role" "staff_role_enum"[] NOT NULL,
	"base_salary" numeric(18, 2) NOT NULL,
	"salary" numeric(18, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "work_assignment" (
	"staff_id" varchar(50) NOT NULL,
	"service_id" varchar(50) NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"position" varchar(100),
	"revenue_rate_share" numeric(5, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "work_assignment_staff_id_service_id_year_month_pk" PRIMARY KEY("staff_id","service_id","year","month")
);
--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_company_id_company_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("company_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_detail" ADD CONSTRAINT "invoice_detail_invoice_id_invoice_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("invoice_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_detail" ADD CONSTRAINT "invoice_detail_service_id_service_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("service_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_log" ADD CONSTRAINT "usage_log_service_id_service_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("service_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_log" ADD CONSTRAINT "usage_log_consumer_id_service_consumer_consumer_id_fk" FOREIGN KEY ("consumer_id") REFERENCES "public"."service_consumer"("consumer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company" ADD CONSTRAINT "company_consumer_id_service_consumer_consumer_id_fk" FOREIGN KEY ("consumer_id") REFERENCES "public"."service_consumer"("consumer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee" ADD CONSTRAINT "employee_consumer_id_service_consumer_consumer_id_fk" FOREIGN KEY ("consumer_id") REFERENCES "public"."service_consumer"("consumer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee" ADD CONSTRAINT "employee_company_id_company_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("company_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_contract" ADD CONSTRAINT "company_contract_company_id_company_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("company_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_contract" ADD CONSTRAINT "company_contract_office_id_office_office_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."office"("office_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "area_based" ADD CONSTRAINT "fk_area_based_policy" FOREIGN KEY ("service_id","policy_id") REFERENCES "public"."pricing_policy"("service_id","policy_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "headcount_based" ADD CONSTRAINT "fk_headcount_based_policy" FOREIGN KEY ("service_id","policy_id") REFERENCES "public"."pricing_policy"("service_id","policy_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_policy" ADD CONSTRAINT "pricing_policy_service_id_service_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("service_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_assignment" ADD CONSTRAINT "work_assignment_staff_id_building_staff_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."building_staff"("staff_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_assignment" ADD CONSTRAINT "work_assignment_service_id_service_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("service_id") ON DELETE no action ON UPDATE no action;