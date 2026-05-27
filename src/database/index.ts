import "server-only";

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

import * as schema from './schema/schema';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var __pgPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL no está definido en el entorno.');
}

// Pool configuration for production readiness
const poolConfig = {
  connectionString,
  max: process.env.DB_MAX_CONNECTIONS ? parseInt(process.env.DB_MAX_CONNECTIONS) : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // Use SSL in production if not explicitly disabled
  ssl: process.env.NODE_ENV === 'production' && process.env.DB_DISABLE_SSL !== 'true' 
    ? { rejectUnauthorized: false } 
    : undefined,
};

const pool = global.__pgPool ?? new Pool(poolConfig);

if (process.env.NODE_ENV !== 'production') global.__pgPool = pool;

export const db = drizzle(pool, { schema });