import { z } from 'zod';

export const envSchema = z.object({
  ITUNES_BASE_URL: z
    .string()
    .trim()
    .nonempty({ message: 'ITUNES_BASE_URL must not be empty' }),
});

export type EnvVars = z.infer<typeof envSchema>;
