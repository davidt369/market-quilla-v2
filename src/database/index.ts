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
  connectionTimeoutMillis: 10000,
  // Require SSL for Neon DB (or any remote DB), unless it's localhost
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
    ? undefined
    : { rejectUnauthorized: false },
};

const pool = global.__pgPool ?? new Pool(poolConfig);

if (process.env.NODE_ENV !== 'production') global.__pgPool = pool;

export const db = drizzle(pool, { schema });