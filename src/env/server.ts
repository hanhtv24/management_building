import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { z } from 'zod';

expand(config());

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']),
  DB_URL: z.string(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(z.treeifyError(parsed.error).properties);
  process.exit(1);
}

export const env = parsed.data;
