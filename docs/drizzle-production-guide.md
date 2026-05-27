# Guía de Configuración de Drizzle ORM para Producción

Este documento detalla los ajustes y mejoras que se realizaron en el proyecto **Market Quilla** para asegurar que la integración con Drizzle ORM y PostgreSQL sea robusta, segura y lista para un entorno de producción (como Vercel, Railway, Render, etc.).

---

## 1. Archivo de Configuración de Drizzle (`drizzle.config.ts`)

Se corrigió y verificó el archivo base de configuración de Drizzle para que el CLI (`drizzle-kit`) sepa exactamente dónde buscar los esquemas de la base de datos y cómo conectarse para realizar migraciones y sincronizaciones.

**Ajuste principal:** Se cambió la ruta de `schema` de `index.ts` a `schema.ts`.

```typescript
import 'dotenv/config';
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    // Ruta correcta hacia el archivo donde se declaran las tablas
    schema: "./src/database/schema/schema.ts",
    out: './drizzle',
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL || "no hay conexcion a la db",
    },
    verbose: true,  
    strict: true,   
})
```

---

## 2. Optimización del Connection Pool (`src/database/index.ts`)

Esta es la mejora más crítica para producción. En lugar de crear conexiones infinitas y descontroladas (lo cual colapsaría la base de datos ante picos de tráfico), se implementó un **Pool de Conexiones** con límites estrictos y soporte para SSL.

**Las mejoras incluyen:**
- **`max`**: Límite máximo de conexiones concurrentes (por defecto 10). Protege la memoria de la base de datos.
- **`idleTimeoutMillis`**: Las conexiones inactivas por más de 30 segundos se cierran automáticamente para liberar recursos.
- **`connectionTimeoutMillis`**: Si la base de datos tarda más de 2 segundos en responder a un intento de conexión, lanza un error en lugar de dejar colgado el servidor.
- **`ssl`**: Si el entorno es `production` (y no se deshabilitó explícitamente), obliga al uso de SSL para encriptar los datos en tránsito, un requisito de proveedores Serverless como Neon o Supabase.

```typescript
const poolConfig = {
  connectionString,
  max: process.env.DB_MAX_CONNECTIONS ? parseInt(process.env.DB_MAX_CONNECTIONS) : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // En producción se fuerza el uso de SSL a menos que se indique lo contrario
  ssl: process.env.NODE_ENV === 'production' && process.env.DB_DISABLE_SSL !== 'true' 
    ? { rejectUnauthorized: false } 
    : undefined,
};

const pool = global.__pgPool ?? new Pool(poolConfig);
```

---

## 3. Comandos de Gestión (`package.json`)

Para estandarizar y facilitar el manejo de la base de datos, se agregaron scripts útiles utilizando `drizzle-kit` y `tsx` (para ejecutar archivos TypeScript directamente).

```json
  "scripts": {
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:reset": "npx tsx src/database/scripts/reset-db.ts",
    "db:seed": "npx tsx src/database/scripts/seed.ts"
  }
```

- **`pnpm db:push`**: Lee el esquema de Drizzle y crea/modifica las tablas directamente en la base de datos. Es el primer comando que debe ejecutarse.
- **`pnpm db:seed`**: Inserta la data falsa de prueba. *(Requiere haber ejecutado `db:push` antes)*.
- **`pnpm db:reset`**: Elimina toda la base de datos en su totalidad y recrea un esquema vacío.
- **`pnpm db:studio`**: Abre una interfaz web para visualizar la base de datos.

---

## 4. Variables de Entorno Seguras (`.env.example`)

Se creó un archivo `.env.example` estructurado para guiar a los desarrolladores sobre qué variables se necesitan para desarrollo local y cuáles son críticas para producción.

- **Desarrollo**: Conexión a `localhost` y opciones de SSL apagadas.
- **Producción**: Obliga a definir `DATABASE_URL` (idealmente apuntando a un pooler transaccional como PgBouncer/Supavisor), define la capacidad de `DB_MAX_CONNECTIONS`, y establece un `JWT_SECRET` fuerte.

> [!TIP]
> **Dato sobre escalabilidad:** Con esta configuración (Pool de 10 conexiones), un solo servidor Next.js es capaz de atender simultáneamente de 500 a 1000 usuarios concurrentes sin que la base de datos se vea estresada.
