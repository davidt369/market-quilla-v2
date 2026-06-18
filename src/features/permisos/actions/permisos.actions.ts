"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/shared/lib/auth-utils";
import {
  getPermisosConRoles,
  updatePermisosRol,
} from "../services/permisos.service";
import type { RolBase } from "@/shared/config/permisos.constants";

export async function getPermisosConRolesAction() {
  await requirePermission("configurar-permisos");
  return getPermisosConRoles();
}

export async function updatePermisosRolAction(
  rol: RolBase,
  permisosActivos: string[]
) {
  await requirePermission("configurar-permisos");

  if (rol === "administrador") {
    return { error: "No se pueden modificar los permisos del administrador" };
  }

  await updatePermisosRol(rol, permisosActivos);
  revalidatePath("/dashboard/configuracion/permisos");

  return { success: true };
}