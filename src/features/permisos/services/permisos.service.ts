import { eq, and } from "drizzle-orm";
import { db } from "@/database";
import { tbpermisos, tbroles_permisos } from "@/database/schema/schema";
import type { RolBase } from "@/shared/config/permisos.constants";

export type PermisoWithModule = {
  pk_id_permiso: string;
  nombre: string;
  descripcion: string | null;
  modulo: string;
  activo: boolean;
};

export type PermisosConRoles = {
  permisos: PermisoWithModule[];
  asignaciones: Record<RolBase, string[]>;
};

export async function getPermisosActivos(): Promise<PermisoWithModule[]> {
  return db
    .select({
      pk_id_permiso: tbpermisos.pk_id_permiso,
      nombre: tbpermisos.nombre,
      descripcion: tbpermisos.descripcion,
      modulo: tbpermisos.modulo,
      activo: tbpermisos.activo,
    })
    .from(tbpermisos)
    .where(eq(tbpermisos.activo, true))
    .orderBy(tbpermisos.modulo, tbpermisos.nombre);
}

export async function getPermisosPorRol(
  rol: RolBase
): Promise<string[]> {
  const rows = await db
    .select({ codigo: tbroles_permisos.fk_id_permiso })
    .from(tbroles_permisos)
    .where(
      and(
        eq(tbroles_permisos.rol, rol),
        eq(tbroles_permisos.activo, true)
      )
    );

  return rows.map((r) => r.codigo);
}

export async function getPermisosConRoles(): Promise<PermisosConRoles> {
  const permisos = await getPermisosActivos();
  const roles: RolBase[] = ["administrador", "supervisor", "recepcionista", "cajero"];

  const asignaciones: Record<RolBase, string[]> = {
    administrador: [],
    supervisor: [],
    recepcionista: [],
    cajero: [],
  };

  for (const rol of roles) {
    asignaciones[rol] = await getPermisosPorRol(rol);
  }

  return { permisos, asignaciones };
}

export async function updatePermisosRol(
  rol: RolBase,
  permisosActivos: string[]
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(tbroles_permisos)
      .set({ activo: false })
      .where(eq(tbroles_permisos.rol, rol));

    if (permisosActivos.length > 0) {
      await tx.insert(tbroles_permisos).values(
        permisosActivos.map((codigo) => ({
          rol,
          fk_id_permiso: codigo,
          activo: true,
        }))
      ).onConflictDoUpdate({
        target: [tbroles_permisos.rol, tbroles_permisos.fk_id_permiso],
        set: { activo: true },
      });
    }
  });
}