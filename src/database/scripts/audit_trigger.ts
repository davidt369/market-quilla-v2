import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool);

async function setupAuditTriggers() {
  console.log("🚀 Iniciando configuración de triggers de auditoría...");

  try {
    // 1. Crear la función del trigger
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION log_audit_event()
      RETURNS TRIGGER AS $$
      DECLARE
        v_user_id INTEGER;
        v_entity_name VARCHAR;
        v_action_name VARCHAR;
        v_old_data JSONB;
        v_new_data JSONB;
        v_pk_col_name VARCHAR;
        v_entity_id INTEGER;
        v_user_id_str VARCHAR;
        v_ip VARCHAR;
      BEGIN
        -- El nombre de la columna Primary Key se pasa como primer argumento al trigger
        v_pk_col_name := TG_ARGV[0];
        
        -- Obtener usuario e IP de la sesión de Postgres (si Next.js los mandó)
        v_user_id_str := current_setting('app.user_id', true);
        v_ip := current_setting('app.ip_address', true);
        
        IF v_user_id_str IS NOT NULL AND v_user_id_str != '' THEN
          v_user_id := v_user_id_str::integer;
        END IF;

        IF (TG_OP = 'DELETE') THEN
          v_action_name := 'DELETE';
          v_old_data := row_to_json(OLD)::jsonb;
          v_new_data := NULL;
          v_entity_id := (v_old_data->>v_pk_col_name)::integer;
          
          -- Intentar extraer fk_id_usuario si existe
          IF v_user_id IS NULL AND v_old_data ? 'fk_id_usuario' THEN
            v_user_id := (v_old_data->>'fk_id_usuario')::integer;
          END IF;
        ELSE
          IF (TG_OP = 'UPDATE') THEN
            v_action_name := 'UPDATE';
            v_old_data := row_to_json(OLD)::jsonb;
          ELSIF (TG_OP = 'INSERT') THEN
            v_action_name := 'INSERT';
            v_old_data := NULL;
          END IF;
          
          v_new_data := row_to_json(NEW)::jsonb;
          v_entity_id := (v_new_data->>v_pk_col_name)::integer;
          
          IF v_user_id IS NULL AND v_new_data ? 'fk_id_usuario' THEN
            v_user_id := (v_new_data->>'fk_id_usuario')::integer;
          END IF;
        END IF;

        v_entity_name := TG_TABLE_NAME;

        -- Insertar el registro en la tabla de auditoría
        INSERT INTO tbauditoria (
          fk_id_usuario,
          accion,
          entidad,
          entidad_id,
          old_values,
          new_values,
          fecha,
          ip
        ) VALUES (
          v_user_id,
          v_action_name,
          v_entity_name,
          v_entity_id,
          v_old_data,
          v_new_data,
          now(),
          v_ip
        );

        IF (TG_OP = 'DELETE') THEN
          RETURN OLD;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log("✅ Función de trigger 'log_audit_event' creada exitosamente.");

    // 2. Aplicar el trigger a tbpaquetes
    await db.execute(sql`DROP TRIGGER IF EXISTS audit_paquetes ON tbpaquetes;`);
    await db.execute(sql`
      CREATE TRIGGER audit_paquetes
      AFTER INSERT OR UPDATE OR DELETE ON tbpaquetes
      FOR EACH ROW EXECUTE FUNCTION log_audit_event('pk_id_paquete');
    `);
    console.log("✅ Trigger aplicado a la tabla 'tbpaquetes'.");

    // 3. Aplicar el trigger a tbcaja_movimientos
    await db.execute(sql`DROP TRIGGER IF EXISTS audit_caja_movimientos ON tbcaja_movimientos;`);
    await db.execute(sql`
      CREATE TRIGGER audit_caja_movimientos
      AFTER INSERT OR UPDATE OR DELETE ON tbcaja_movimientos
      FOR EACH ROW EXECUTE FUNCTION log_audit_event('pk_id_movimiento');
    `);
    console.log("✅ Trigger aplicado a la tabla 'tbcaja_movimientos'.");

    // 4. Aplicar el trigger a tbclientes
    await db.execute(sql`DROP TRIGGER IF EXISTS audit_clientes ON tbclientes;`);
    await db.execute(sql`
      CREATE TRIGGER audit_clientes
      AFTER INSERT OR UPDATE OR DELETE ON tbclientes
      FOR EACH ROW EXECUTE FUNCTION log_audit_event('pk_id_cliente');
    `);
    console.log("✅ Trigger aplicado a la tabla 'tbclientes'.");

    // 5. Aplicar el trigger a tbusuarios
    await db.execute(sql`DROP TRIGGER IF EXISTS audit_usuarios ON tbusuarios;`);
    await db.execute(sql`
      CREATE TRIGGER audit_usuarios
      AFTER INSERT OR UPDATE OR DELETE ON tbusuarios
      FOR EACH ROW EXECUTE FUNCTION log_audit_event('pk_id_usuario');
    `);
    console.log("✅ Trigger aplicado a la tabla 'tbusuarios'.");

    // 6. Aplicar el trigger a tbcaja_turnos
    await db.execute(sql`DROP TRIGGER IF EXISTS audit_caja_turnos ON tbcaja_turnos;`);
    await db.execute(sql`
      CREATE TRIGGER audit_caja_turnos
      AFTER INSERT OR UPDATE OR DELETE ON tbcaja_turnos
      FOR EACH ROW EXECUTE FUNCTION log_audit_event('pk_id_cajaTurno');
    `);
    console.log("✅ Trigger aplicado a la tabla 'tbcaja_turnos'.");

    // 7. Aplicar el trigger a tbpermisos
    await db.execute(sql`DROP TRIGGER IF EXISTS audit_permisos ON tbpermisos;`);
    await db.execute(sql`
      CREATE TRIGGER audit_permisos
      AFTER INSERT OR UPDATE OR DELETE ON tbpermisos
      FOR EACH ROW EXECUTE FUNCTION log_audit_event('pk_id_permiso');
    `);
    console.log("✅ Trigger aplicado a la tabla 'tbpermisos'.");

    // 8. Aplicar el trigger a tbroles_permisos
    await db.execute(sql`DROP TRIGGER IF EXISTS audit_roles_permisos ON tbroles_permisos;`);
    await db.execute(sql`
      CREATE TRIGGER audit_roles_permisos
      AFTER INSERT OR UPDATE OR DELETE ON tbroles_permisos
      FOR EACH ROW EXECUTE FUNCTION log_audit_event('fk_id_rol'); -- using one of the composite keys for entity_id
    `);
    console.log("✅ Trigger aplicado a la tabla 'tbroles_permisos'.");

    // 9. Bloqueo de manipulación de la auditoría (Append-Only)
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION prevent_audit_tampering()
      RETURNS TRIGGER AS $$
      BEGIN
        RAISE EXCEPTION '⛔ Seguridad: Los registros de auditoría son inmutables y no pueden ser modificados o eliminados.';
      END;
      $$ LANGUAGE plpgsql;
    `);
    await db.execute(sql`DROP TRIGGER IF EXISTS protect_audit_logs ON tbauditoria;`);
    await db.execute(sql`
      CREATE TRIGGER protect_audit_logs
      BEFORE UPDATE OR DELETE ON tbauditoria
      FOR EACH ROW EXECUTE FUNCTION prevent_audit_tampering();
    `);
    console.log("✅ Protección Append-Only aplicada a la tabla 'tbauditoria'.");

    console.log("🎉 Configuración de auditoría completada con éxito.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al configurar los triggers de auditoría:", error);
    process.exit(1);
  }
}

setupAuditTriggers();
