# Plan: Sistema Dinámico de Permisos y Roles

## 1. Visión General

Sistema de autorización basado en permisos granulares por rol, configurable dinámicamente desde una interfaz administrativa. Un administrador puede activar/desactivar permisos para cualquier rol en tiempo real sin necesidad de redeploy.

---

## 2. Modelo de Datos

### 2.1 Tabla `tbpermisos` — Catálogo Maestro de Permisos

Cada permiso es un string único (`pk_id_permiso`) que funciona como identificador universal entre código y base de datos.

| Campo | Tipo | Descripción |
|---|---|---|
| `pk_id_permiso` | VARCHAR(100) | ID único (ej: `registrar-paquete`). **PK**. |
| `nombre` | VARCHAR(200) | Nombre legible (ej: "Registrar Paquete") |
| `descripcion` | TEXT | Descripción detallada |
| `modulo` | VARCHAR(50) | Agrupación visual (dashboard, caja, paquetes, clientes, usuarios, configuracion) |
| `activo` | BOOLEAN | Permite desactivar permisos sin eliminar el registro |

### 2.2 Tabla `tbroles_permisos` — Asignaciones Rol ↔ Permiso

| Campo | Tipo | Descripción |
|---|---|---|
| `pk_id` | SERIAL | PK |
| `fk_id_permiso` | VARCHAR(100) | FK → `tbpermisos.pk_id_permiso` |
| `rol` | rol_base_enum | Uno de: administrador, supervisor, recepcionista, cajero |
| `activo` | BOOLEAN | Permite desactivar una asignación sin eliminar el registro |

**Constraint única**: `(rol, fk_id_permiso)` para evitar duplicados.

---

## 3. Flujo de Autenticación

### Ciclo de Vida

```
LOGIN → JWT Callback consulta DB → permisos[] embebidos en el token JWT
                                                  ↓
              Cada request → NextAuth verifica JWT → permisos[] disponibles
                                                  ↓
              Zustand Store sincroniza → hasPermission() disponible en client
```

### Detalle del JWT Callback (`auth.ts`)

- **En login**: Se consulta `tbroles_permisos` filtrado por `rol` del usuario.
- **Administrador**: Obtiene el comodín `"*"` (todos los permisos sin consultar DB).
- **Refresh**: Si se activa `session` callback con refresh, se consulta la DB en cada request (~5ms con índice).

---

## 4. Permisos Definidos

### Catálogo Completo (17 permisos)

| Permiso | Nombre | Módulo | Descripción |
|---|---|---|---|
| `ver-dashboard` | Ver Dashboard | dashboard | Acceder al panel principal |
| `acceso-caja` | Acceso a Caja | caja | Ver la página de caja |
| `abrir-caja` | Abrir Caja | caja | Iniciar un turno de caja |
| `cerrar-caja` | Cerrar Caja | caja | Cerrar el turno de caja propio |
| `cerrar-caja-otros` | Cerrar Caja de Otros | caja | Cerrar turnos de otros usuarios |
| `registrar-movimiento-manual` | Movimientos Manuales | caja | Registrar ingresos/egresos manuales |
| `realizar-arqueo` | Realizar Arqueo | caja | Hacer conteo de efectivo |
| `registrar-paquete` | Registrar Paquete | paquetes | Crear nuevos paquetes |
| `editar-paquete` | Editar Paquete | paquetes | Modificar paquetes existentes |
| `eliminar-paquete` | Eliminar Paquete | paquetes | Anular/eliminar paquetes |
| `entregar-paquete` | Entregar Paquete | paquetes | Marcar paquete como entregado |
| `ver-paquetes-sin-entregar` | Ver Paquetes Pendientes | paquetes | Ver paquetes sin entregar |
| `ver-todos-paquetes` | Ver Todos los Paquetes | paquetes | Ver lista completa de paquetes |
| `gestionar-clientes` | Gestionar Clientes | clientes | CRUD completo de clientes |
| `ver-usuarios` | Ver Usuarios | usuarios | Ver listado de usuarios |
| `gestionar-usuarios` | Gestionar Usuarios | usuarios | Crear/editar/eliminar usuarios |
| `configurar-permisos` | Configurar Permisos | configuracion | Acceder a la matriz de permisos (solo admin) |

### Permisos por Rol (Defaults)

#### Administrador
Todos los permisos (comodín `"*"` en JWT).

#### Supervisor
```
ver-dashboard, acceso-caja, abrir-caja, cerrar-caja, cerrar-caja-otros,
registrar-movimiento-manual, realizar-arqueo,
registrar-paquete, editar-paquete, eliminar-paquete, entregar-paquete,
ver-paquetes-sin-entregar, ver-todos-paquetes,
gestionar-clientes, ver-usuarios
```

#### Cajero
```
ver-dashboard, acceso-caja, abrir-caja, cerrar-caja,
registrar-movimiento-manual, realizar-arqueo,
entregar-paquete, ver-paquetes-sin-entregar
```

#### Recepcionista
```
ver-dashboard,
registrar-paquete, editar-paquete, ver-paquetes-sin-entregar,
gestionar-clientes
```

---

## 5. Backend: Protección de Server Actions

### Helper `requirePermission()` (`src/shared/lib/auth-utils.ts`)

```typescript
export async function requirePermission(permission: string): Promise<Session["user"]>
export async function requireAnyPermission(permissions: string[]): Promise<Session["user"]>
```

**Comportamiento**:
1. Verifica que el usuario esté autenticado.
2. Si `rolBase === "administrador"`, retorna inmediatamente.
3. Verifica que el permiso esté en `session.user.permisos`.
4. Si no, lanza `UnauthorizedError`.
5. Retorna el usuario de la sesión.

### Server Actions Protegidas

| Server Action | Permiso Requerido |
|---|---|
| `createUsuarioAction` | `gestionar-usuarios` |
| `updateUsuarioAction` | `gestionar-usuarios` |
| `deleteUsuarioAction` | `gestionar-usuarios` |
| `saveUsuarioAction` | `gestionar-usuarios` |
| `abrirCajaAction` | `abrir-caja` |
| `cerrarCajaAction` | `cerrar-caja` |
| `realizarArqueoAction` | `realizar-arqueo` |
| `registrarMovimientoManualAction` | `registrar-movimiento-manual` |
| `registrarPaqueteAction` | `registrar-paquete` |
| `updatePaqueteAction` | `editar-paquete` |
| `deletePaqueteAction` | `eliminar-paquete` |
| `entregarPaqueteAction` | `entregar-paquete` |
| `createClienteAction` | `gestionar-clientes` |
| `updateClienteAction` | `gestionar-clientes` |
| `deleteClienteAction` | `gestionar-clientes` |
| `saveClienteAction` | `gestionar-clientes` |
| `getPermisosConRolesAction` | `configurar-permisos` |
| `updatePermisosRolAction` | `configurar-permisos` |

---

## 6. Frontend: Renderizado Condicional

### 6.1 Sidebar (`app-sidebar.tsx`)

Cada `NavItem` tiene un campo `permission: string | null`. Se filtra con `useAuthStore.hasPermission()`:

```typescript
// Filtrado
group.items.filter(item => !item.permission || hasPermission(item.permission))
```

### 6.2 Mobile Tab Bar (`mobile-tabbar.tsx`)

Mismo patrón: cada tab tiene `permission?: string`, se filtra antes de renderizar.

### 6.3 Protección de Rutas Directas

En cada grupo de rutas que requiere permisos específicos, se crea un `layout.tsx` que verifica:

```typescript
const session = await auth();
if (!session?.user.permisos?.includes("gestionar-usuarios")) {
  redirect("/dashboard");
}
```

---

## 7. Módulo de Configuración de Permisos

### 7.1 Ruta
`/dashboard/configuracion/permisos` — Visible **solo** para admin.

### 7.2 Componente: MatrizPermisos

- **Columnas**: Roles (excepto Administrador que es fijo)
- **Filas**: Permisos agrupados por `modulo`
- **Celdas**: Checkboxes editables (Admin tiene todos checked y disabled)
- **Guardar**: Botón que ejecuta `updatePermisosRolAction` con las asignaciones nuevas

### 7.3 Server Actions del Módulo

| Action | Descripción |
|---|---|
| `getPermisosConRolesAction` | Obtiene todos los permisos y las asignaciones actuales por rol |
| `updatePermisosRolAction` | Reemplaza todas las asignaciones de un rol específico |

---

## 8. Archivos a Crear/Modificar

### Nuevos (6)
| Archivo | Propósito |
|---|---|
| `src/shared/config/permisos.constants.ts` | Lista maestra de permisos con metadatos |
| `src/shared/lib/auth-utils.ts` | Helpers `requirePermission()`, `UnauthorizedError` |
| `src/features/permisos/services/permisos.service.ts` | Queries a `tbpermisos`, `tbroles_permisos` |
| `src/features/permisos/actions/permisos.actions.ts` | Server actions del módulo |
| `src/features/permisos/components/matriz-permisos.tsx` | Componente de matriz interactiva |
| `src/app/dashboard/configuracion/permisos/page.tsx` | Página admin de configuración |

### Modificar (10+)
| Archivo | Cambio |
|---|---|
| `src/database/schema/schema.ts` | +2 tablas |
| `src/database/scripts/seed.ts` | +`seedPermisos()` |
| `src/shared/lib/auth.ts` | JWT callback consulta DB |
| `src/app/dashboard/components/app-sidebar.tsx` | Filtrado por `hasPermission()` |
| `src/app/dashboard/components/mobile-tabbar.tsx` | Filtrado por permisos + fix URL Caja |
| `src/features/caja/actions/caja.actions.ts` | +`requirePermission()` en cada action |
| `src/features/clientes/actions/clientes.actions.ts` | +`requirePermission()` en cada action |
| `src/features/paquetes/actions/paquetes.actions.ts` | +`requirePermission()` en cada action |
| `src/features/usuarios/actions/usuario.actions.ts` | +`requirePermission()` en cada action |
| `src/app/dashboard/usuarios/page.tsx` | +protección de ruta |

---

## 9. Proceso para Agregar un Nuevo Módulo

### Paso a Paso

```
1. DESARROLLO DEL MÓDULO
   ├── Crear server actions (ej: listarReportesAction, generarReporteAction)
   ├── Agregar requirePermission("ver-reportes") al inicio
   ├── Crear page: /dashboard/reportes
   └── Definir los items de navegación con permission: "ver-reportes"

2. AGREGAR PERMISO AL SEED
   ├── Editar seedPermisos() en seed.ts
   └── Agregar: { pk_id_permiso: "ver-reportes", nombre: "Ver Reportes", modulo: "reportes" }

3. DESPLIEGUE
   ├── pnpm dlx drizzle-kit push   (aplica schema)
   ├── pnpm run db:seed             (inserta nuevos permisos)
   ├── Admin entra a Configuración > Permisos
   └── Asigna "Ver Reportes" a los roles deseados
```

### Script de Sincronización (Opcional)

Para automatizar la inserción de nuevos permisos en producción:

```bash
pnpm run db:sync-permisos   # src/database/scripts/sync-permisos.ts
```

---

## 10. Consideraciones de Producción

### Rendimiento
- El JWT tiene `maxAge: 30 días`. Los permisos solo se consultan en login/refresh.
- Query de permisos en JWT: ~10ms con índice en `tbroles_permisos(rol)`.
- Session callback opcional (refresh en cada request): ~5ms con índice. Desactivado por defecto.

### Seguridad
- La validación de permisos en Server Actions es la fuente de verdad. La UI es UX.
- El permiso `configurar-permisos` no es editable desde la matriz (columna Admin es fixed).
- Administrador siempre tiene acceso total via comodín `"*"`.
- Drizzle ORM previene inyección SQL automáticamente.

### Invalidación de Permisos
- Si se cambian permisos en DB, los usuarios existentes seguirán usando los permisos de su JWT hasta que expire (30 días).
- Para invalidación inmediata, el admin debe pedir a los usuarios que cierren sesión.
- Opcional: activar refresh en `session` callback (~5ms extra por request).

### Índices Creados
```sql
CREATE INDEX idx_rolpermisos_rol ON tbroles_permisos(rol);
UNIQUE INDEX uq_rol_permiso ON tbroles_permisos(rol, fk_id_permiso);
```

---

## 11. Diagrama de Flujo

```
ADMIN                           USUARIO NORMAL
   │                                    │
   ▼                                    ▼
Configuración > Permisos           LOGIN
   │                                    │
   ▼                                    ▼
updatePermisosRolAction()    JWT Callback
   │                           │   Consulta DB
tbroles_permisos (DB) ◄───────┤
   │                           │
   ├───────────────────────────┤
   ▼                           ▼
Permisos[] en JWT          Permisos[] en JWT
(encriptado, 30 días)      (encriptado, 30 días)
   │                           │
   ├───────────────────────────┤
   ▼                           ▼
Sidebar / Mobile Tab      Sidebar / Mobile Tab
(filtrado con hasPermission)  (filtrado con hasPermission)
   │                           │
   ▼                           ▼
Server Action             Server Action
requirePermission()      requirePermission()
   │                           │
   ├── tiene permiso ──► ✅ Ejecuta lógica
   └── NO tiene permiso ──► ❌ UnauthorizedError
```