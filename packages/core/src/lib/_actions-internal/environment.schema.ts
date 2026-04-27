import z from 'zod';

export const EnvironmentSchema = z.enum(['preview', 'production']);

export type Environment = z.infer<typeof EnvironmentSchema>;
