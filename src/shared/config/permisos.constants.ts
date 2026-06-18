export const PERMISSIONS = {
  VER_DASHBOARD: "ver-dashboard",
  ACCESO_CAJA: "acceso-caja",
  ABRIR_CAJA: "abrir-caja",
  CERRAR_CAJA: "cerrar-caja",
  CERRAR_CAJA_OTROS: "cerrar-caja-otros",
  REGISTRAR_MOVIMIENTO_MANUAL: "registrar-movimiento-manual",
  REALIZAR_ARQUEO: "realizar-arqueo",
  REGISTRAR_PAQUETE: "registrar-paquete",
  EDITAR_PAQUETE: "editar-paquete",
  ELIMINAR_PAQUETE: "eliminar-paquete",
  ENTREGAR_PAQUETE: "entregar-paquete",
  VER_PAQUETES_SIN_ENTREGAR: "ver-paquetes-sin-entregar",
  VER_TODOS_PAQUETES: "ver-todos-paquetes",
  GESTIONAR_CLIENTES: "gestionar-clientes",
  VER_USUARIOS: "ver-usuarios",
  GESTIONAR_USUARIOS: "gestionar-usuarios",
  CONFIGURAR_PERMISOS: "configurar-permisos",
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type PermissionValue = (typeof PERMISSIONS)[PermissionKey];

export const PERMISSION_LABELS: Record<PermissionValue, string> = {
  [PERMISSIONS.VER_DASHBOARD]: "Ver Dashboard",
  [PERMISSIONS.ACCESO_CAJA]: "Acceso a Caja",
  [PERMISSIONS.ABRIR_CAJA]: "Abrir Caja",
  [PERMISSIONS.CERRAR_CAJA]: "Cerrar Caja",
  [PERMISSIONS.CERRAR_CAJA_OTROS]: "Cerrar Caja de Otros",
  [PERMISSIONS.REGISTRAR_MOVIMIENTO_MANUAL]: "Movimientos Manuales",
  [PERMISSIONS.REALIZAR_ARQUEO]: "Realizar Arqueo",
  [PERMISSIONS.REGISTRAR_PAQUETE]: "Registrar Paquete",
  [PERMISSIONS.EDITAR_PAQUETE]: "Editar Paquete",
  [PERMISSIONS.ELIMINAR_PAQUETE]: "Eliminar Paquete",
  [PERMISSIONS.ENTREGAR_PAQUETE]: "Entregar Paquete",
  [PERMISSIONS.VER_PAQUETES_SIN_ENTREGAR]: "Ver Paquetes Pendientes",
  [PERMISSIONS.VER_TODOS_PAQUETES]: "Ver Todos los Paquetes",
  [PERMISSIONS.GESTIONAR_CLIENTES]: "Gestionar Clientes",
  [PERMISSIONS.VER_USUARIOS]: "Ver Usuarios",
  [PERMISSIONS.GESTIONAR_USUARIOS]: "Gestionar Usuarios",
  [PERMISSIONS.CONFIGURAR_PERMISOS]: "Configurar Permisos",
};

export const PERMISSION_MODULES = [
  "dashboard",
  "caja",
  "paquetes",
  "clientes",
  "usuarios",
  "configuracion",
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];

export const PERMISSIONS_BY_MODULE: Record<PermissionModule, PermissionValue[]> = {
  dashboard: [PERMISSIONS.VER_DASHBOARD],
  caja: [
    PERMISSIONS.ACCESO_CAJA,
    PERMISSIONS.ABRIR_CAJA,
    PERMISSIONS.CERRAR_CAJA,
    PERMISSIONS.CERRAR_CAJA_OTROS,
    PERMISSIONS.REGISTRAR_MOVIMIENTO_MANUAL,
    PERMISSIONS.REALIZAR_ARQUEO,
  ],
  paquetes: [
    PERMISSIONS.REGISTRAR_PAQUETE,
    PERMISSIONS.EDITAR_PAQUETE,
    PERMISSIONS.ELIMINAR_PAQUETE,
    PERMISSIONS.ENTREGAR_PAQUETE,
    PERMISSIONS.VER_PAQUETES_SIN_ENTREGAR,
    PERMISSIONS.VER_TODOS_PAQUETES,
  ],
  clientes: [PERMISSIONS.GESTIONAR_CLIENTES],
  usuarios: [PERMISSIONS.VER_USUARIOS, PERMISSIONS.GESTIONAR_USUARIOS],
  configuracion: [PERMISSIONS.CONFIGURAR_PERMISOS],
};

export const MODULE_LABELS: Record<PermissionModule, string> = {
  dashboard: "Dashboard",
  caja: "Caja",
  paquetes: "Paquetes",
  clientes: "Clientes",
  usuarios: "Usuarios",
  configuracion: "Configuración",
};

export type RolBase = "administrador" | "supervisor" | "recepcionista" | "cajero";

export const ROLES: RolBase[] = [
  "administrador",
  "supervisor",
  "recepcionista",
  "cajero",
];

export const ROL_LABELS: Record<RolBase, string> = {
  administrador: "Administrador",
  supervisor: "Supervisor",
  recepcionista: "Recepcionista",
  cajero: "Cajero",
};