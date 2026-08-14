import { z } from 'zod';

/**
 * A machine as the Fly Machines API returns it.
 *
 * Field names are Fly's own, and only `id` is required — it is the one thing a
 * caller acts on. Everything else is context for a log line or a panel, and a
 * restart should not fail because Fly added a state nobody has seen yet.
 */
export const MachineApiResponseSchema = z.object({
  id: z.string(),
  name: z.string().nullish(),
  /** `started`, `stopped`, `suspended`, … — Fly owns this vocabulary */
  state: z.string().nullish(),
  region: z.string().nullish()
});

export type Machine = z.infer<typeof MachineApiResponseSchema>;

/** Machines listed for an app */
export const MachineListApiResponseSchema = z.array(MachineApiResponseSchema);
