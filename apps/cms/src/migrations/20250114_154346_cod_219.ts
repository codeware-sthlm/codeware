import { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';
import { sql } from 'drizzle-orm';

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`

-- Handle new field tenants.slug --

-- Add the column as nullable
ALTER TABLE "tenants" ADD COLUMN "slug" varchar;

-- Update existing records with a default slug if needed
UPDATE "tenants" SET "slug" = 'tenant-' || id::text WHERE "slug" IS NULL;

-- Then make it NOT NULL after populating
ALTER TABLE "tenants" ALTER COLUMN "slug" SET NOT NULL;

-- Add the index after ensuring all data is valid
CREATE INDEX IF NOT EXISTS "tenants_slug_idx" ON "tenants" USING btree ("slug");

-- Auto-generated migration below --

DO $$ BEGIN
 CREATE TYPE "public"."enum_users_tenants_role" AS ENUM('user', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TYPE "enum_users_role" ADD VALUE 'system-user';
CREATE TABLE IF NOT EXISTS "articles_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"tenants_id" integer
);

CREATE TABLE IF NOT EXISTS "pages_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"tenants_id" integer
);

CREATE TABLE IF NOT EXISTS "tenants_domains" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"domain" varchar NOT NULL
);

CREATE TABLE IF NOT EXISTS "users_tenants" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"role" "enum_users_tenants_role" NOT NULL
);

CREATE TABLE IF NOT EXISTS "users_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"tenants_id" integer
);

DROP INDEX IF EXISTS "articles_title_idx";
DROP INDEX IF EXISTS "pages_title_idx";
ALTER TABLE "articles" ALTER COLUMN "slug" DROP NOT NULL;
ALTER TABLE "pages" ALTER COLUMN "slug" DROP NOT NULL;
ALTER TABLE "pages" ADD COLUMN "content_html" varchar;
ALTER TABLE "pages" ADD COLUMN "intro_html" varchar;
-- ALTER TABLE "tenants" ADD COLUMN "slug" varchar NOT NULL;
ALTER TABLE "users" ADD COLUMN "description" varchar;
DO $$ BEGIN
 ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_tenants_fk" FOREIGN KEY ("tenants_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_tenants_fk" FOREIGN KEY ("tenants_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "tenants_domains" ADD CONSTRAINT "tenants_domains_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "users_tenants" ADD CONSTRAINT "users_tenants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_tenants_fk" FOREIGN KEY ("tenants_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "articles_rels_order_idx" ON "articles_rels" USING btree ("order");
CREATE INDEX IF NOT EXISTS "articles_rels_parent_idx" ON "articles_rels" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "articles_rels_path_idx" ON "articles_rels" USING btree ("path");
CREATE INDEX IF NOT EXISTS "articles_rels_tenants_id_idx" ON "articles_rels" USING btree ("tenants_id");
CREATE INDEX IF NOT EXISTS "pages_rels_order_idx" ON "pages_rels" USING btree ("order");
CREATE INDEX IF NOT EXISTS "pages_rels_parent_idx" ON "pages_rels" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "pages_rels_path_idx" ON "pages_rels" USING btree ("path");
CREATE INDEX IF NOT EXISTS "pages_rels_tenants_id_idx" ON "pages_rels" USING btree ("tenants_id");
CREATE INDEX IF NOT EXISTS "tenants_domains_order_idx" ON "tenants_domains" USING btree ("_order");
CREATE INDEX IF NOT EXISTS "tenants_domains_parent_id_idx" ON "tenants_domains" USING btree ("_parent_id");
CREATE INDEX IF NOT EXISTS "users_tenants_order_idx" ON "users_tenants" USING btree ("_order");
CREATE INDEX IF NOT EXISTS "users_tenants_parent_id_idx" ON "users_tenants" USING btree ("_parent_id");
CREATE INDEX IF NOT EXISTS "users_rels_order_idx" ON "users_rels" USING btree ("order");
CREATE INDEX IF NOT EXISTS "users_rels_parent_idx" ON "users_rels" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "users_rels_path_idx" ON "users_rels" USING btree ("path");
CREATE INDEX IF NOT EXISTS "users_rels_tenants_id_idx" ON "users_rels" USING btree ("tenants_id");
CREATE INDEX IF NOT EXISTS "tenants_slug_idx" ON "tenants" USING btree ("slug");`);
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`

ALTER TYPE "enum_users_role" ADD VALUE 'admin';
DROP TABLE "articles_rels";
DROP TABLE "pages_rels";
DROP TABLE "tenants_domains";
DROP TABLE "users_tenants";
DROP TABLE "users_rels";
DROP INDEX IF EXISTS "tenants_slug_idx";
ALTER TABLE "articles" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "pages" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "articles_title_idx" ON "articles_locales" USING btree ("title");
CREATE UNIQUE INDEX IF NOT EXISTS "pages_title_idx" ON "pages_locales" USING btree ("title");
ALTER TABLE "pages" DROP COLUMN IF EXISTS "content_html";
ALTER TABLE "pages" DROP COLUMN IF EXISTS "intro_html";
ALTER TABLE "tenants" DROP COLUMN IF EXISTS "slug";
ALTER TABLE "users" DROP COLUMN IF EXISTS "description";`);
}
