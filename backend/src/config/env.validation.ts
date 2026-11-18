import { z } from 'zod';

const booleanFromString = z
  .union([z.boolean(), z.string()])
  .transform((v) => (typeof v === 'boolean' ? v : !['false', '0', 'no', 'off'].includes(v.toLowerCase())));

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    OPENAI_API_KEY: z.string().trim().min(1, 'OPENAI_API_KEY is required'),
    OPENAI_CHAT_MODEL: z.string().min(1).default('gpt-4.1-mini'),
    OPENAI_EMBEDDING_MODEL: z.string().min(1).default('text-embedding-3-small'),
    OPENAI_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
    SOURCE_DIR: z.string().min(1).default('../source'),
    LOAD_DOCUMENTS_ON_STARTUP: booleanFromString.default(true),
    CHUNK_SIZE: z.coerce.number().int().min(200).max(4000).default(800),
    CHUNK_OVERLAP: z.coerce.number().int().min(0).default(120),
    TOP_K: z.coerce.number().int().min(1).max(20).default(5),
    MIN_SIMILARITY: z.coerce.number().min(0).max(1).default(0.3),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    CHAT_RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(20),
  })
  .refine((env) => env.CHUNK_OVERLAP < env.CHUNK_SIZE, {
    message: 'CHUNK_OVERLAP must be smaller than CHUNK_SIZE',
    path: ['CHUNK_OVERLAP'],
  });

export type Env = z.infer<typeof envSchema>;

/** Used by ConfigModule. Error messages list keys only, never values (no secret leakage). */
export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}
