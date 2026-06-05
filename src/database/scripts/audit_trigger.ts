import "dotenv/config";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function main() {
  console.log("Configurando Triggers de Auditoría en la Base de Datos...");

  // 1. Crear la función genérica del trigger
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION log_audit_trigger()
    RETURNS trigger AS $$
    DECLARE
      v_empresa_id INTEGER;
      v_usuario_id INTEGER;
      v_entidad_id INTEGER;
      v_detalles TEXT;
      pk_column TEXT;
    BEGIN
      -- Obtener el nombre de la llave primaria desde los argumentos
      IF TG_NARGS > 0 THEN
        pk_column := TG_ARGV[0];
      ELSE
        pk_column := 'id';
      END IF;

      -- Leer contexto inyectado por la app (con manejo seguro de excepciones)
      BEGIN
        v_usuario_id := NULLIF(current_setting('app.current_user_id', true), '')::INTEGER;
      EXCEPTION WHEN OTHERS THEN
        v_usuario_id := NULL;
      END;

      BEGIN
        v_empresa_id := NULLIF(current_setting('app.current_empresa_id', true), '')::INTEGER;
      EXCEPTION WHEN OTHERS THEN
        v_empresa_id := NULL;
      END;

      -- Obtener el ID del registro afectado según la PK de la tabla
      IF TG_OP = 'DELETE' THEN
        EXECUTE format('SELECT ($1).%I', pk_column) USING OLD INTO v_entidad_id;
      ELSE
        EXECUTE format('SELECT ($1).%I', pk_column) USING NEW INTO v_entidad_id;
      END IF;

      -- Si empresa_id no vino en el contexto, extraerlo del registro (si tiene fk_empresa_id)
      IF v_empresa_id IS NULL AND TG_TABLE_NAME != 'tbauditoria' THEN
        BEGIN
          IF TG_OP = 'DELETE' THEN
            EXECUTE format('SELECT ($1).%I', 'fk_empresa_id') USING OLD INTO v_empresa_id;
          ELSE
            EXECUTE format('SELECT ($1).%I', 'fk_empresa_id') USING NEW INTO v_empresa_id;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          v_empresa_id := NULL;
        END;
      END IF;

      -- Manejo especial para tbempresas (la empresa se audita a sí misma)
      IF TG_TABLE_NAME = 'tbempresas' AND v_empresa_id IS NULL THEN
        v_empresa_id := v_entidad_id;
      END IF;

      -- Construir detalle JSON con los datos relevantes
      IF TG_OP = 'INSERT' THEN
        v_detalles := jsonb_build_object('nuevo', row_to_json(NEW))::TEXT;
      ELSIF TG_OP = 'UPDATE' THEN
        v_detalles := jsonb_build_object('anterior', row_to_json(OLD), 'nuevo', row_to_json(NEW))::TEXT;
      ELSIF TG_OP = 'DELETE' THEN
        v_detalles := jsonb_build_object('anterior', row_to_json(OLD))::TEXT;
      END IF;

      -- Evitar loop infinito auditando la propia tabla de auditoría
      IF TG_TABLE_NAME != 'tbauditoria' THEN
        INSERT INTO tbauditoria (
          fk_empresa_id,
          fk_usuario_id,
          accion,
          entidad,
          entidad_id,
          detalles,
          ip,
          dispositivo
        ) VALUES (
          v_empresa_id,
          v_usuario_id,
          TG_OP,
          TG_TABLE_NAME,
          v_entidad_id,
          v_detalles,
          NULLIF(current_setting('app.current_ip', true), ''),
          NULLIF(current_setting('app.current_device', true), '')
        );
      END IF;

      IF TG_OP = 'DELETE' THEN
        RETURN OLD;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `);

  console.log("Función log_audit_trigger() creada exitosamente.");

  // 2. Asociar el Trigger a cada tabla con su Primary Key específica
  const tablas: Record<string, string> = {
    'tbempresas': 'pk_empresa',
    'tbsucursales': 'pk_sucursal',
    'tbusuarios': 'pk_usuario',
    'tbroles': 'pk_rol',
    'tbpermisos': 'pk_permiso',
    'tbroles_permisos': 'pk_rol_permiso',
    'tbusuarios_roles': 'pk_usuario_rol',
    'tbclientes': 'pk_cliente',
    'tbpaquetes': 'pk_paquete',
    'caja_turno': 'id',
    'tbgastos_caja': 'id',
    'tbtransacciones': 'id',
    'tbpaquete_historial': 'id',
    'tbconfiguracion': 'id'
  };

  for (const [tabla, pk] of Object.entries(tablas)) {
    console.log(`Aplicando trigger a la tabla ${tabla} (PK: ${pk})...`);
    await db.execute(sql.raw(`DROP TRIGGER IF EXISTS trg_audit_${tabla} ON "${tabla}";`));
    await db.execute(sql.raw(`
      CREATE TRIGGER trg_audit_${tabla}
      AFTER INSERT OR UPDATE OR DELETE ON "${tabla}"
      FOR EACH ROW EXECUTE FUNCTION log_audit_trigger('${pk}');
    `));
  }

  console.log("¡Auditoría automática aplicada a todas las tablas exitosamente!");
  await pool.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("Error aplicando triggers:", err);
  await pool.end();
  process.exit(1);
});
