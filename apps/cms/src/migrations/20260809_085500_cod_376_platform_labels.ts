import type { HeroIconName } from '@codeware/shared/ui/primitives';
import type { PlatformLabel } from '@codeware/shared/util/payload-types';
import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * Seed the baseline platform labels.
 *
 * Kept as its own migration rather than folded into the schema one, which is
 * regenerated whenever the collections change. Seed data never runs in
 * production, so a migration is the only way these reach a live database.
 *
 * Idempotent — a label already present keeps whatever a system user has since
 * made of it.
 */

type Label = {
  icon: HeroIconName;
  name: string;
  type: PlatformLabel['type'];
};

const labels: Array<Label> = [
  { type: 'place-kind', name: 'winery', icon: 'BuildingStorefrontIcon' },
  { type: 'place-kind', name: 'hotel', icon: 'HomeModernIcon' },
  { type: 'place-kind', name: 'restaurant', icon: 'CakeIcon' },
  { type: 'place-kind', name: 'activity', icon: 'MapIcon' },
  { type: 'place-kind', name: 'other', icon: 'MapPinIcon' },
  { type: 'stock-subject', name: 'vineyard', icon: 'PhotoIcon' },
  { type: 'stock-subject', name: 'vine rows', icon: 'PhotoIcon' },
  { type: 'stock-subject', name: 'terraces', icon: 'PhotoIcon' },
  { type: 'stock-subject', name: 'village', icon: 'PhotoIcon' },
  { type: 'stock-subject', name: 'river valley', icon: 'PhotoIcon' },
  { type: 'stock-subject', name: 'rolling hills', icon: 'PhotoIcon' },
  { type: 'stock-subject', name: 'vineyard hut', icon: 'PhotoIcon' },
  { type: 'stock-subject', name: 'cellar', icon: 'PhotoIcon' },
  { type: 'stock-subject', name: 'table', icon: 'PhotoIcon' }
];

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const { icon, name, type } of labels) {
    await db.execute(sql`
      INSERT INTO "payload"."platform_labels" ("type", "name", "icon", "updated_at", "created_at")
      SELECT ${type}::"payload"."enum_platform_labels_type", ${name}, ${icon}, now(), now()
      WHERE NOT EXISTS (
        SELECT 1 FROM "payload"."platform_labels"
        WHERE "type" = ${type}::"payload"."enum_platform_labels_type" AND "name" = ${name}
      );
    `);
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Only remove labels nothing points at, so a workspace that has started
  // using one does not lose the reference
  for (const { name, type } of labels) {
    await db.execute(sql`
      DELETE FROM "payload"."platform_labels" AS l
      WHERE l."type" = ${type}::"payload"."enum_platform_labels_type"
        AND l."name" = ${name}
        AND NOT EXISTS (SELECT 1 FROM "payload"."places" p WHERE p."kind_id" = l."id")
        AND NOT EXISTS (SELECT 1 FROM "payload"."stock_media" m WHERE m."subject_id" = l."id");
    `);
  }
}
