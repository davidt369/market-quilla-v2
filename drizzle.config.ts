import 'dotenv/config';
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/database/schema/schema.ts",
    out: './drizzle',
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL || "no hay conexcion a la db",
    },
    verbose: true,  // Muestra las queries SQL en consola
    strict: true,   // Modo estricto para mejores prácticas
})