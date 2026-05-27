import 'dotenv/config';
import { Pool } from 'pg';

async function resetDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL no está definido en el entorno.');
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    await client.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid();');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE;');
    await client.query('CREATE SCHEMA public;');
    await client.query('GRANT ALL ON SCHEMA public TO public;');
    await client.query('GRANT ALL ON SCHEMA public TO postgres;');
    console.log('Base de datos limpiada: esquema public recreado.');
  } finally {
    client.release();
    await pool.end();
  }
}

void resetDatabase().catch((error) => {
  console.error('Error al resetear la base de datos:', error);
  process.exitCode = 1;
});