import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  // Only target docs that have no version history — these are pre-existing docs
  // that were wrongly set to 'draft' by the DEFAULT 'draft' column migration.
  // Docs already touched through Payload after versioning was enabled have
  // _pages_v / _posts_v entries and should keep whatever status they have.
  const { rows: pageRows } = await db.execute<{ id: number }>(sql`
    SELECT id FROM "payload"."pages"
    WHERE NOT EXISTS (
      SELECT 1 FROM "payload"."_pages_v" WHERE "parent_id" = "pages"."id"
    )
  `);

  for (const { id } of pageRows) {
    await payload.update({
      collection: 'pages',
      id,
      data: { _status: 'published' }
    });
  }

  const { rows: postRows } = await db.execute<{ id: number }>(sql`
    SELECT id FROM "payload"."posts"
    WHERE NOT EXISTS (
      SELECT 1 FROM "payload"."_posts_v" WHERE "parent_id" = "posts"."id"
    )
  `);

  for (const { id } of postRows) {
    await payload.update({
      collection: 'posts',
      id,
      data: { _status: 'published' }
    });
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // No safe rollback — we cannot know which docs were previously unpublished
}
