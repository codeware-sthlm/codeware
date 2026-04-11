import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * Moves all enum types from the `public` schema into the `payload` schema
 * so that every type referenced by payload tables lives in the correct schema.
 *
 * Background: early migrations created enums without an explicit schema prefix,
 * which caused PostgreSQL to place them in `public` (the default search_path at
 * that time). Later migrations started using `"payload"."enum_*"` qualifiers, so
 * new types ended up in `payload` while old ones stayed in `public`.
 *
 * This migration:
 *  1. Creates each missing enum in `payload` (guarded – safe to run on databases
 *     that were already patched manually).
 *  2. Migrates every affected column to the `payload`-qualified type.
 *  3. Drops the now-unused `public` copies.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- ----------------------------------------------------------------
    -- 1. Ensure all enums exist in the payload schema
    --    (DO/EXCEPTION guards make this idempotent for prod databases
    --     that were already patched manually)
    -- ----------------------------------------------------------------
    DO $$ BEGIN CREATE TYPE "payload"."_locales" AS ENUM('en', 'sv'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "payload"."enum_code_language" AS ENUM('ts', 'plaintext', 'tsx', 'js', 'jsx'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "payload"."enum_content_column_size" AS ENUM('one-third', 'half', 'two-thirds', 'full'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "payload"."enum_forms_confirmation_type" AS ENUM('message', 'redirect'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "payload"."enum_forms_redirect_type" AS ENUM('reference', 'custom'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "payload"."enum_link_type" AS ENUM('reference', 'custom'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "payload"."enum_nav_trigger" AS ENUM('card', 'link'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "payload"."enum_navigation_label_source" AS ENUM('document', 'custom'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "payload"."enum_social_media_direction" AS ENUM('horizontal', 'vertical'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "payload"."enum_social_media_platform" AS ENUM('discord', 'email', 'facebook', 'github', 'instagram', 'linkedin', 'npm', 'phone', 'web', 'x', 'youtube'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "payload"."enum_spacing_size" AS ENUM('tight', 'regular', 'loose'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "payload"."enum_tenant_user_role" AS ENUM('user', 'admin'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "payload"."enum_user_role" AS ENUM('admin', 'user', 'system-user'); EXCEPTION WHEN duplicate_object THEN null; END $$;

    -- ----------------------------------------------------------------
    -- 2. Migrate _locale columns to payload._locales
    -- ----------------------------------------------------------------
    ALTER TABLE "payload"."categories_locales"                           ALTER COLUMN "_locale" TYPE "payload"."_locales" USING "_locale"::text::"payload"."_locales";
    ALTER TABLE "payload"."forms_blocks_checkbox_locales"                ALTER COLUMN "_locale" TYPE "payload"."_locales" USING "_locale"::text::"payload"."_locales";
    ALTER TABLE "payload"."forms_blocks_country_locales"                 ALTER COLUMN "_locale" TYPE "payload"."_locales" USING "_locale"::text::"payload"."_locales";
    ALTER TABLE "payload"."forms_blocks_date_locales"                    ALTER COLUMN "_locale" TYPE "payload"."_locales" USING "_locale"::text::"payload"."_locales";
    ALTER TABLE "payload"."forms_blocks_email_locales"                   ALTER COLUMN "_locale" TYPE "payload"."_locales" USING "_locale"::text::"payload"."_locales";
    ALTER TABLE "payload"."forms_blocks_message_locales"                 ALTER COLUMN "_locale" TYPE "payload"."_locales" USING "_locale"::text::"payload"."_locales";
    ALTER TABLE "payload"."forms_blocks_number_locales"                  ALTER COLUMN "_locale" TYPE "payload"."_locales" USING "_locale"::text::"payload"."_locales";
    ALTER TABLE "payload"."forms_blocks_radio_locales"                   ALTER COLUMN "_locale" TYPE "payload"."_locales" USING "_locale"::text::"payload"."_locales";
    ALTER TABLE "payload"."forms_blocks_radio_options_locales"           ALTER COLUMN "_locale" TYPE "payload"."_locales" USING "_locale"::text::"payload"."_locales";
    ALTER TABLE "payload"."forms_blocks_select_locales"                  ALTER COLUMN "_locale" TYPE "payload"."_locales" USING "_locale"::text::"payload"."_locales";
    ALTER TABLE "payload"."forms_blocks_select_options_locales"          ALTER COLUMN "_locale" TYPE "payload"."_locales" USING "_locale"::text::"payload"."_locales";
    ALTER TABLE "payload"."forms_blocks_text_locales"                    ALTER COLUMN "_locale" TYPE "payload"."_locales" USING "_locale"::text::"payload"."_locales";
    ALTER TABLE "payload"."forms_blocks_textarea_locales"                ALTER COLUMN "_locale" TYPE "payload"."_locales" USING "_locale"::text::"payload"."_locales";
    ALTER TABLE "payload"."forms_emails_locales"                         ALTER COLUMN "_locale" TYPE "payload"."_locales" USING "_locale"::text::"payload"."_locales";
    ALTER TABLE "payload"."forms_locales"                                ALTER COLUMN "_locale" TYPE "payload"."_locales" USING "_locale"::text::"payload"."_locales";
    ALTER TABLE "payload"."media_locales"                                ALTER COLUMN "_locale" TYPE "payload"."_locales" USING "_locale"::text::"payload"."_locales";
    ALTER TABLE "payload"."pages_locales"                                ALTER COLUMN "_locale" TYPE "payload"."_locales" USING "_locale"::text::"payload"."_locales";
    ALTER TABLE "payload"."posts_locales"                                ALTER COLUMN "_locale" TYPE "payload"."_locales" USING "_locale"::text::"payload"."_locales";
    ALTER TABLE "payload"."reusable_content_blocks_card_cards_locales"   ALTER COLUMN "_locale" TYPE "payload"."_locales" USING "_locale"::text::"payload"."_locales";

    -- ----------------------------------------------------------------
    -- 3. Migrate other enum columns
    --    For columns with a DEFAULT, drop it first (the stored expression
    --    is typed against the old type and cannot be auto-cast), change
    --    the type, then restore the default.
    -- ----------------------------------------------------------------
    ALTER TABLE "payload"."pages_blocks_code"                            ALTER COLUMN "language"          DROP DEFAULT;
    ALTER TABLE "payload"."pages_blocks_code"                            ALTER COLUMN "language"          TYPE "payload"."enum_code_language"              USING "language"::text::"payload"."enum_code_language";
    ALTER TABLE "payload"."pages_blocks_code"                            ALTER COLUMN "language"          SET DEFAULT 'ts';

    ALTER TABLE "payload"."reusable_content_blocks_code"                 ALTER COLUMN "language"          DROP DEFAULT;
    ALTER TABLE "payload"."reusable_content_blocks_code"                 ALTER COLUMN "language"          TYPE "payload"."enum_code_language"              USING "language"::text::"payload"."enum_code_language";
    ALTER TABLE "payload"."reusable_content_blocks_code"                 ALTER COLUMN "language"          SET DEFAULT 'ts';

    ALTER TABLE "payload"."pages_blocks_content_columns"                 ALTER COLUMN "size"              DROP DEFAULT;
    ALTER TABLE "payload"."pages_blocks_content_columns"                 ALTER COLUMN "size"              TYPE "payload"."enum_content_column_size"         USING "size"::text::"payload"."enum_content_column_size";
    ALTER TABLE "payload"."pages_blocks_content_columns"                 ALTER COLUMN "size"              SET DEFAULT 'full';

    ALTER TABLE "payload"."reusable_content_blocks_content_columns"      ALTER COLUMN "size"              DROP DEFAULT;
    ALTER TABLE "payload"."reusable_content_blocks_content_columns"      ALTER COLUMN "size"              TYPE "payload"."enum_content_column_size"         USING "size"::text::"payload"."enum_content_column_size";
    ALTER TABLE "payload"."reusable_content_blocks_content_columns"      ALTER COLUMN "size"              SET DEFAULT 'full';

    ALTER TABLE "payload"."forms"                                        ALTER COLUMN "confirmation_type" DROP DEFAULT;
    ALTER TABLE "payload"."forms"                                        ALTER COLUMN "confirmation_type" TYPE "payload"."enum_forms_confirmation_type"    USING "confirmation_type"::text::"payload"."enum_forms_confirmation_type";
    ALTER TABLE "payload"."forms"                                        ALTER COLUMN "confirmation_type" SET DEFAULT 'message';

    ALTER TABLE "payload"."forms"                                        ALTER COLUMN "redirect_type"     DROP DEFAULT;
    ALTER TABLE "payload"."forms"                                        ALTER COLUMN "redirect_type"     TYPE "payload"."enum_forms_redirect_type"        USING "redirect_type"::text::"payload"."enum_forms_redirect_type";
    ALTER TABLE "payload"."forms"                                        ALTER COLUMN "redirect_type"     SET DEFAULT 'reference';

    ALTER TABLE "payload"."pages_blocks_card_cards"                      ALTER COLUMN "link_type"         TYPE "payload"."enum_link_type"                  USING "link_type"::text::"payload"."enum_link_type";

    ALTER TABLE "payload"."reusable_content_blocks_card_cards"           ALTER COLUMN "link_type"         DROP DEFAULT;
    ALTER TABLE "payload"."reusable_content_blocks_card_cards"           ALTER COLUMN "link_type"         TYPE "payload"."enum_link_type"                  USING "link_type"::text::"payload"."enum_link_type";
    ALTER TABLE "payload"."reusable_content_blocks_card_cards"           ALTER COLUMN "link_type"         SET DEFAULT 'reference';

    ALTER TABLE "payload"."pages_blocks_card_cards"                      ALTER COLUMN "link_nav_trigger"  TYPE "payload"."enum_nav_trigger"                USING "link_nav_trigger"::text::"payload"."enum_nav_trigger";

    ALTER TABLE "payload"."reusable_content_blocks_card_cards"           ALTER COLUMN "link_nav_trigger"  DROP DEFAULT;
    ALTER TABLE "payload"."reusable_content_blocks_card_cards"           ALTER COLUMN "link_nav_trigger"  TYPE "payload"."enum_nav_trigger"                USING "link_nav_trigger"::text::"payload"."enum_nav_trigger";
    ALTER TABLE "payload"."reusable_content_blocks_card_cards"           ALTER COLUMN "link_nav_trigger"  SET DEFAULT 'card';

    ALTER TABLE "payload"."navigation_items"                             ALTER COLUMN "label_source"      DROP DEFAULT;
    ALTER TABLE "payload"."navigation_items"                             ALTER COLUMN "label_source"      TYPE "payload"."enum_navigation_label_source"    USING "label_source"::text::"payload"."enum_navigation_label_source";
    ALTER TABLE "payload"."navigation_items"                             ALTER COLUMN "label_source"      SET DEFAULT 'document';

    ALTER TABLE "payload"."pages_blocks_social_media"                    ALTER COLUMN "direction"         DROP DEFAULT;
    ALTER TABLE "payload"."pages_blocks_social_media"                    ALTER COLUMN "direction"         TYPE "payload"."enum_social_media_direction"     USING "direction"::text::"payload"."enum_social_media_direction";
    ALTER TABLE "payload"."pages_blocks_social_media"                    ALTER COLUMN "direction"         SET DEFAULT 'horizontal';

    ALTER TABLE "payload"."reusable_content_blocks_social_media"         ALTER COLUMN "direction"         DROP DEFAULT;
    ALTER TABLE "payload"."reusable_content_blocks_social_media"         ALTER COLUMN "direction"         TYPE "payload"."enum_social_media_direction"     USING "direction"::text::"payload"."enum_social_media_direction";
    ALTER TABLE "payload"."reusable_content_blocks_social_media"         ALTER COLUMN "direction"         SET DEFAULT 'horizontal';

    ALTER TABLE "payload"."pages_blocks_social_media_social"             ALTER COLUMN "platform"          TYPE "payload"."enum_social_media_platform"      USING "platform"::text::"payload"."enum_social_media_platform";
    ALTER TABLE "payload"."reusable_content_blocks_social_media_social"  ALTER COLUMN "platform"          TYPE "payload"."enum_social_media_platform"      USING "platform"::text::"payload"."enum_social_media_platform";

    ALTER TABLE "payload"."pages_blocks_spacing"                         ALTER COLUMN "size"              DROP DEFAULT;
    ALTER TABLE "payload"."pages_blocks_spacing"                         ALTER COLUMN "size"              TYPE "payload"."enum_spacing_size"               USING "size"::text::"payload"."enum_spacing_size";
    ALTER TABLE "payload"."pages_blocks_spacing"                         ALTER COLUMN "size"              SET DEFAULT 'regular';

    ALTER TABLE "payload"."reusable_content_blocks_spacing"              ALTER COLUMN "size"              DROP DEFAULT;
    ALTER TABLE "payload"."reusable_content_blocks_spacing"              ALTER COLUMN "size"              TYPE "payload"."enum_spacing_size"               USING "size"::text::"payload"."enum_spacing_size";
    ALTER TABLE "payload"."reusable_content_blocks_spacing"              ALTER COLUMN "size"              SET DEFAULT 'regular';

    ALTER TABLE "payload"."users_tenants"                                ALTER COLUMN "role"              DROP DEFAULT;
    ALTER TABLE "payload"."users_tenants"                                ALTER COLUMN "role"              TYPE "payload"."enum_tenant_user_role"           USING "role"::text::"payload"."enum_tenant_user_role";
    ALTER TABLE "payload"."users_tenants"                                ALTER COLUMN "role"              SET DEFAULT 'user';

    ALTER TABLE "payload"."users"                                        ALTER COLUMN "role"              DROP DEFAULT;
    ALTER TABLE "payload"."users"                                        ALTER COLUMN "role"              TYPE "payload"."enum_user_role"                  USING "role"::text::"payload"."enum_user_role";
    ALTER TABLE "payload"."users"                                        ALTER COLUMN "role"              SET DEFAULT 'user';

    -- ----------------------------------------------------------------
    -- 4. Drop the now-unused public schema copies
    --    (IF EXISTS guards make this safe even if already removed)
    -- ----------------------------------------------------------------
    DROP TYPE IF EXISTS "public"."_locales";
    DROP TYPE IF EXISTS "public"."enum_code_language";
    DROP TYPE IF EXISTS "public"."enum_content_column_size";
    DROP TYPE IF EXISTS "public"."enum_forms_confirmation_type";
    DROP TYPE IF EXISTS "public"."enum_forms_redirect_type";
    DROP TYPE IF EXISTS "public"."enum_link_type";
    DROP TYPE IF EXISTS "public"."enum_nav_trigger";
    DROP TYPE IF EXISTS "public"."enum_navigation_label_source";
    DROP TYPE IF EXISTS "public"."enum_social_media_direction";
    DROP TYPE IF EXISTS "public"."enum_social_media_platform";
    DROP TYPE IF EXISTS "public"."enum_spacing_size";
    -- enum_tenant_domain_page_type: orphaned public copy. The cod_290 migration
    -- already renamed the payload copy to "n" and the column was migrated away
    -- from this type, so there is no payload equivalent to create or cast to.
    DROP TYPE IF EXISTS "public"."enum_tenant_domain_page_type";
    DROP TYPE IF EXISTS "public"."enum_tenant_user_role";
    DROP TYPE IF EXISTS "public"."enum_user_role";
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- ----------------------------------------------------------------
    -- 1. Re-create public schema enums
    -- ----------------------------------------------------------------
    CREATE TYPE "public"."_locales" AS ENUM('en', 'sv');
    CREATE TYPE "public"."enum_code_language" AS ENUM('ts', 'plaintext', 'tsx', 'js', 'jsx');
    CREATE TYPE "public"."enum_content_column_size" AS ENUM('one-third', 'half', 'two-thirds', 'full');
    CREATE TYPE "public"."enum_forms_confirmation_type" AS ENUM('message', 'redirect');
    CREATE TYPE "public"."enum_forms_redirect_type" AS ENUM('reference', 'custom');
    CREATE TYPE "public"."enum_link_type" AS ENUM('reference', 'custom');
    CREATE TYPE "public"."enum_nav_trigger" AS ENUM('card', 'link');
    CREATE TYPE "public"."enum_navigation_label_source" AS ENUM('document', 'custom');
    CREATE TYPE "public"."enum_social_media_direction" AS ENUM('horizontal', 'vertical');
    CREATE TYPE "public"."enum_social_media_platform" AS ENUM('discord', 'email', 'facebook', 'github', 'instagram', 'linkedin', 'npm', 'phone', 'web', 'x', 'youtube');
    CREATE TYPE "public"."enum_spacing_size" AS ENUM('tight', 'regular', 'loose');
    CREATE TYPE "public"."enum_tenant_domain_page_type" AS ENUM('cms', 'client', 'disabled');
    CREATE TYPE "public"."enum_tenant_user_role" AS ENUM('user', 'admin');
    CREATE TYPE "public"."enum_user_role" AS ENUM('admin', 'user', 'system-user');

    -- ----------------------------------------------------------------
    -- 2. Revert _locale columns back to public._locales
    -- ----------------------------------------------------------------
    ALTER TABLE "payload"."categories_locales"                           ALTER COLUMN "_locale" TYPE "public"."_locales" USING "_locale"::text::"public"."_locales";
    ALTER TABLE "payload"."forms_blocks_checkbox_locales"                ALTER COLUMN "_locale" TYPE "public"."_locales" USING "_locale"::text::"public"."_locales";
    ALTER TABLE "payload"."forms_blocks_country_locales"                 ALTER COLUMN "_locale" TYPE "public"."_locales" USING "_locale"::text::"public"."_locales";
    ALTER TABLE "payload"."forms_blocks_date_locales"                    ALTER COLUMN "_locale" TYPE "public"."_locales" USING "_locale"::text::"public"."_locales";
    ALTER TABLE "payload"."forms_blocks_email_locales"                   ALTER COLUMN "_locale" TYPE "public"."_locales" USING "_locale"::text::"public"."_locales";
    ALTER TABLE "payload"."forms_blocks_message_locales"                 ALTER COLUMN "_locale" TYPE "public"."_locales" USING "_locale"::text::"public"."_locales";
    ALTER TABLE "payload"."forms_blocks_number_locales"                  ALTER COLUMN "_locale" TYPE "public"."_locales" USING "_locale"::text::"public"."_locales";
    ALTER TABLE "payload"."forms_blocks_radio_locales"                   ALTER COLUMN "_locale" TYPE "public"."_locales" USING "_locale"::text::"public"."_locales";
    ALTER TABLE "payload"."forms_blocks_radio_options_locales"           ALTER COLUMN "_locale" TYPE "public"."_locales" USING "_locale"::text::"public"."_locales";
    ALTER TABLE "payload"."forms_blocks_select_locales"                  ALTER COLUMN "_locale" TYPE "public"."_locales" USING "_locale"::text::"public"."_locales";
    ALTER TABLE "payload"."forms_blocks_select_options_locales"          ALTER COLUMN "_locale" TYPE "public"."_locales" USING "_locale"::text::"public"."_locales";
    ALTER TABLE "payload"."forms_blocks_text_locales"                    ALTER COLUMN "_locale" TYPE "public"."_locales" USING "_locale"::text::"public"."_locales";
    ALTER TABLE "payload"."forms_blocks_textarea_locales"                ALTER COLUMN "_locale" TYPE "public"."_locales" USING "_locale"::text::"public"."_locales";
    ALTER TABLE "payload"."forms_emails_locales"                         ALTER COLUMN "_locale" TYPE "public"."_locales" USING "_locale"::text::"public"."_locales";
    ALTER TABLE "payload"."forms_locales"                                ALTER COLUMN "_locale" TYPE "public"."_locales" USING "_locale"::text::"public"."_locales";
    ALTER TABLE "payload"."media_locales"                                ALTER COLUMN "_locale" TYPE "public"."_locales" USING "_locale"::text::"public"."_locales";
    ALTER TABLE "payload"."pages_locales"                                ALTER COLUMN "_locale" TYPE "public"."_locales" USING "_locale"::text::"public"."_locales";
    ALTER TABLE "payload"."posts_locales"                                ALTER COLUMN "_locale" TYPE "public"."_locales" USING "_locale"::text::"public"."_locales";
    ALTER TABLE "payload"."reusable_content_blocks_card_cards_locales"   ALTER COLUMN "_locale" TYPE "public"."_locales" USING "_locale"::text::"public"."_locales";

    -- ----------------------------------------------------------------
    -- 3. Revert other enum columns back to public schema types
    --    For columns with a DEFAULT, drop it first (the stored expression
    --    is typed and cannot be auto-cast), change the type, then restore.
    -- ----------------------------------------------------------------
    ALTER TABLE "payload"."pages_blocks_code"                            ALTER COLUMN "language"          DROP DEFAULT;
    ALTER TABLE "payload"."pages_blocks_code"                            ALTER COLUMN "language"          TYPE "public"."enum_code_language"              USING "language"::text::"public"."enum_code_language";
    ALTER TABLE "payload"."pages_blocks_code"                            ALTER COLUMN "language"          SET DEFAULT 'ts';

    ALTER TABLE "payload"."reusable_content_blocks_code"                 ALTER COLUMN "language"          DROP DEFAULT;
    ALTER TABLE "payload"."reusable_content_blocks_code"                 ALTER COLUMN "language"          TYPE "public"."enum_code_language"              USING "language"::text::"public"."enum_code_language";
    ALTER TABLE "payload"."reusable_content_blocks_code"                 ALTER COLUMN "language"          SET DEFAULT 'ts';

    ALTER TABLE "payload"."pages_blocks_content_columns"                 ALTER COLUMN "size"              DROP DEFAULT;
    ALTER TABLE "payload"."pages_blocks_content_columns"                 ALTER COLUMN "size"              TYPE "public"."enum_content_column_size"        USING "size"::text::"public"."enum_content_column_size";
    ALTER TABLE "payload"."pages_blocks_content_columns"                 ALTER COLUMN "size"              SET DEFAULT 'full';

    ALTER TABLE "payload"."reusable_content_blocks_content_columns"      ALTER COLUMN "size"              DROP DEFAULT;
    ALTER TABLE "payload"."reusable_content_blocks_content_columns"      ALTER COLUMN "size"              TYPE "public"."enum_content_column_size"        USING "size"::text::"public"."enum_content_column_size";
    ALTER TABLE "payload"."reusable_content_blocks_content_columns"      ALTER COLUMN "size"              SET DEFAULT 'full';

    ALTER TABLE "payload"."forms"                                        ALTER COLUMN "confirmation_type" DROP DEFAULT;
    ALTER TABLE "payload"."forms"                                        ALTER COLUMN "confirmation_type" TYPE "public"."enum_forms_confirmation_type"    USING "confirmation_type"::text::"public"."enum_forms_confirmation_type";
    ALTER TABLE "payload"."forms"                                        ALTER COLUMN "confirmation_type" SET DEFAULT 'message';

    ALTER TABLE "payload"."forms"                                        ALTER COLUMN "redirect_type"     DROP DEFAULT;
    ALTER TABLE "payload"."forms"                                        ALTER COLUMN "redirect_type"     TYPE "public"."enum_forms_redirect_type"        USING "redirect_type"::text::"public"."enum_forms_redirect_type";
    ALTER TABLE "payload"."forms"                                        ALTER COLUMN "redirect_type"     SET DEFAULT 'reference';

    ALTER TABLE "payload"."pages_blocks_card_cards"                      ALTER COLUMN "link_type"         TYPE "public"."enum_link_type"                 USING "link_type"::text::"public"."enum_link_type";

    ALTER TABLE "payload"."reusable_content_blocks_card_cards"           ALTER COLUMN "link_type"         DROP DEFAULT;
    ALTER TABLE "payload"."reusable_content_blocks_card_cards"           ALTER COLUMN "link_type"         TYPE "public"."enum_link_type"                 USING "link_type"::text::"public"."enum_link_type";
    ALTER TABLE "payload"."reusable_content_blocks_card_cards"           ALTER COLUMN "link_type"         SET DEFAULT 'reference';

    ALTER TABLE "payload"."pages_blocks_card_cards"                      ALTER COLUMN "link_nav_trigger"  TYPE "public"."enum_nav_trigger"               USING "link_nav_trigger"::text::"public"."enum_nav_trigger";

    ALTER TABLE "payload"."reusable_content_blocks_card_cards"           ALTER COLUMN "link_nav_trigger"  DROP DEFAULT;
    ALTER TABLE "payload"."reusable_content_blocks_card_cards"           ALTER COLUMN "link_nav_trigger"  TYPE "public"."enum_nav_trigger"               USING "link_nav_trigger"::text::"public"."enum_nav_trigger";
    ALTER TABLE "payload"."reusable_content_blocks_card_cards"           ALTER COLUMN "link_nav_trigger"  SET DEFAULT 'card';

    ALTER TABLE "payload"."navigation_items"                             ALTER COLUMN "label_source"      DROP DEFAULT;
    ALTER TABLE "payload"."navigation_items"                             ALTER COLUMN "label_source"      TYPE "public"."enum_navigation_label_source"   USING "label_source"::text::"public"."enum_navigation_label_source";
    ALTER TABLE "payload"."navigation_items"                             ALTER COLUMN "label_source"      SET DEFAULT 'document';

    ALTER TABLE "payload"."pages_blocks_social_media"                    ALTER COLUMN "direction"         DROP DEFAULT;
    ALTER TABLE "payload"."pages_blocks_social_media"                    ALTER COLUMN "direction"         TYPE "public"."enum_social_media_direction"    USING "direction"::text::"public"."enum_social_media_direction";
    ALTER TABLE "payload"."pages_blocks_social_media"                    ALTER COLUMN "direction"         SET DEFAULT 'horizontal';

    ALTER TABLE "payload"."reusable_content_blocks_social_media"         ALTER COLUMN "direction"         DROP DEFAULT;
    ALTER TABLE "payload"."reusable_content_blocks_social_media"         ALTER COLUMN "direction"         TYPE "public"."enum_social_media_direction"    USING "direction"::text::"public"."enum_social_media_direction";
    ALTER TABLE "payload"."reusable_content_blocks_social_media"         ALTER COLUMN "direction"         SET DEFAULT 'horizontal';

    ALTER TABLE "payload"."pages_blocks_social_media_social"             ALTER COLUMN "platform"          TYPE "public"."enum_social_media_platform"     USING "platform"::text::"public"."enum_social_media_platform";
    ALTER TABLE "payload"."reusable_content_blocks_social_media_social"  ALTER COLUMN "platform"          TYPE "public"."enum_social_media_platform"     USING "platform"::text::"public"."enum_social_media_platform";

    ALTER TABLE "payload"."pages_blocks_spacing"                         ALTER COLUMN "size"              DROP DEFAULT;
    ALTER TABLE "payload"."pages_blocks_spacing"                         ALTER COLUMN "size"              TYPE "public"."enum_spacing_size"              USING "size"::text::"public"."enum_spacing_size";
    ALTER TABLE "payload"."pages_blocks_spacing"                         ALTER COLUMN "size"              SET DEFAULT 'regular';

    ALTER TABLE "payload"."reusable_content_blocks_spacing"              ALTER COLUMN "size"              DROP DEFAULT;
    ALTER TABLE "payload"."reusable_content_blocks_spacing"              ALTER COLUMN "size"              TYPE "public"."enum_spacing_size"              USING "size"::text::"public"."enum_spacing_size";
    ALTER TABLE "payload"."reusable_content_blocks_spacing"              ALTER COLUMN "size"              SET DEFAULT 'regular';

    ALTER TABLE "payload"."users_tenants"                                ALTER COLUMN "role"              DROP DEFAULT;
    ALTER TABLE "payload"."users_tenants"                                ALTER COLUMN "role"              TYPE "public"."enum_tenant_user_role"          USING "role"::text::"public"."enum_tenant_user_role";
    ALTER TABLE "payload"."users_tenants"                                ALTER COLUMN "role"              SET DEFAULT 'user';

    ALTER TABLE "payload"."users"                                        ALTER COLUMN "role"              DROP DEFAULT;
    ALTER TABLE "payload"."users"                                        ALTER COLUMN "role"              TYPE "public"."enum_user_role"                 USING "role"::text::"public"."enum_user_role";
    ALTER TABLE "payload"."users"                                        ALTER COLUMN "role"              SET DEFAULT 'user';

    -- ----------------------------------------------------------------
    -- 4. Drop the payload schema enum copies that were created in up()
    --    Do NOT drop payload._locales — it was created in the very first
    --    migration (cod-213) and is still referenced by locale tables
    --    introduced in cod-290 whose _locale columns are not reverted here.
    --    Also leave enum_site_settings_general_default_locale and
    --    enum_tenant_supported_locales — those belong to cod-290.
    -- ----------------------------------------------------------------
    DROP TYPE IF EXISTS "payload"."enum_code_language";
    DROP TYPE IF EXISTS "payload"."enum_content_column_size";
    DROP TYPE IF EXISTS "payload"."enum_forms_confirmation_type";
    DROP TYPE IF EXISTS "payload"."enum_forms_redirect_type";
    DROP TYPE IF EXISTS "payload"."enum_link_type";
    DROP TYPE IF EXISTS "payload"."enum_nav_trigger";
    DROP TYPE IF EXISTS "payload"."enum_navigation_label_source";
    DROP TYPE IF EXISTS "payload"."enum_social_media_direction";
    DROP TYPE IF EXISTS "payload"."enum_social_media_platform";
    DROP TYPE IF EXISTS "payload"."enum_spacing_size";
    DROP TYPE IF EXISTS "payload"."enum_tenant_user_role";
    DROP TYPE IF EXISTS "payload"."enum_user_role";
  `);
}
