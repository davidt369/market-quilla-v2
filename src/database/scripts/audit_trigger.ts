import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../index";

async function main() {
  console.log("Configurando Triggers de Auditoría en la Base de Datos...");

  // 1. Crear la función genérica del trigger
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION log_audit_trigger()
    RETURNS trigger AS $$
    DECLARE
      v_usuario_id INTEGER;
      v_empresa_id INTEGER;
      v_detalles JSONB;
      v_entidad_id INTEGER;
      pk_column TEXT;
    BEGIN
      -- Obtener el nombre de la llave primaria desde los argumentos (o por defecto 'id')
      IF TG_NARGS > 0 THEN
        pk_column := TG_ARGV[0];
      ELSE
        pk_column := 'id';
      END IF;

      -- Intentar leer las variables inyectadas por la app en la transacción
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

      -- Determinar la entidad afectada y detalles
      IF TG_OP = 'INSERT' THEN
        EXECUTE format('SELECT $1.%I', pk_column) USING NEW INTO v_entidad_id;
        v_detalles := jsonb_build_object('nuevo', row_to_json(NEW));
      ELSIF TG_OP = 'UPDATE' THEN
        EXECUTE format('SELECT $1.%I', pk_column) USING NEW INTO v_entidad_id;
        v_detalles := jsonb_build_object('anterior', row_to_json(OLD), 'nuevo', row_to_json(NEW));
      ELSIF TG_OP = 'DELETE' THEN
        EXECUTE format('SELECT $1.%I', pk_column) USING OLD INTO v_entidad_id;
        v_detalles := jsonb_build_object('anterior', row_to_json(OLD));
      END IF;

      -- Si v_empresa_id no viene en el contexto, intentar extraerlo del registro en sí
      IF v_empresa_id IS NULL AND TG_TABLE_NAME != 'tbauditoria' THEN
        BEGIN
          IF TG_OP = 'DELETE' THEN
             EXECUTE format('SELECT $1.%I', 'fk_empresa_id') USING OLD INTO v_empresa_id;
          ELSE
             EXECUTE format('SELECT $1.%I', 'fk_empresa_id') USING NEW INTO v_empresa_id;
          END IF;
        EXCEPTION WHEN OTHERS THEN
             -- Silencioso, si falla es porque la tabla no tiene fk_empresa_id
        END;
      END IF;
      
      -- Manejo especial para tbempresas
      IF TG_TABLE_NAME = 'tbempresas' AND v_empresa_id IS NULL THEN
          v_empresa_id := COALESCE(v_entidad_id, 1);
      END IF;

      -- Fallback de seguridad MVP
      IF v_empresa_id IS NULL THEN
        v_empresa_id := 1; 
      END IF;

      -- Evitar logear a la tabla de log misma para evitar loops infinitos
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
            v_detalles::TEXT,
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
    console.log(`Aplicando trigger a la tabla ${tabla}...`);
    // Borrar si existía previamente
    await db.execute(sql.raw(`DROP TRIGGER IF EXISTS trg_audit_${tabla} ON ${tabla};`));
    // Crear el nuevo trigger
    await db.execute(sql.raw(`
      CREATE TRIGGER trg_audit_${tabla}
      AFTER INSERT OR UPDATE OR DELETE ON ${tabla}
      FOR EACH ROW EXECUTE FUNCTION log_audit_trigger('${pk}');
    `));
  }

  console.log("¡Auditoría automática aplicada a todas las tablas exitosamente!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error aplicando triggers:", err);
  process.exit(1);
});
