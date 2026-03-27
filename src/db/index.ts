import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';

import * as schema from './schema';

export const db = drizzle(process.env.DB_URL!, { schema });

export const getSeqNextVal = async (seqName: string) => {
  const result = await db.execute(
    sql`SELECT nextval(${seqName}) as next_value`,
  );
  return result.rows[0].next_value;
};
