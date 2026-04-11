export async function verify(
  query: (sql: string) => Promise<string[]>
): Promise<number> {
  let checks = 0;

  // No enum types should remain in the public schema after this migration
  const publicEnums = await query(
    "SELECT typname FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typtype = 'e' ORDER BY typname"
  );
  if (publicEnums.length > 0) {
    throw new Error(
      `Enum types still in public schema: ${publicEnums.join(', ')}`
    );
  }
  checks++;

  // Expected enum types must be present in the payload schema
  const payloadEnums = await query(
    "SELECT typname FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'payload' AND t.typtype = 'e' ORDER BY typname"
  );
  if (payloadEnums.length === 0) {
    throw new Error('No enum types found in the payload schema');
  }
  console.log(`   payload schema has ${payloadEnums.length} enum types`);
  checks++;

  return checks;
}
