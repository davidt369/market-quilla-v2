# Plan de Implementación: Evolución a SaaS Multi-Tenant (MVP Single-Branch)

Este documento detalla la hoja de ruta para desarrollar los módulos principales necesarios para que el MVP funcione correctamente en producción, pero adaptado para ser un **Software as a Service (SaaS)** desde el día 1. 

## User Review Required

> [!WARNING]
> **Cambio Estructural Mayor**: Al convertir el sistema a SaaS, debemos añadir la tabla `tbempresas` (Tenants) y relacionar todo a ella. Todas las consultas deberán filtrar siempre por `empresaId` para garantizar que los datos de diferentes clientes nunca se mezclen. ¿Estás de acuerdo con añadir la tabla `tbempresas` y propagar la clave foránea en todo el sistema?

## Open Questions

> [!IMPORTANT]
> 1. **Gestión del MVP**: Para este MVP enfocado en una sola sucursal, ¿deseas que la "Empresa" inicial se genere automáticamente mediante un script de Seed (base de datos) o hacemos un pequeño onboarding de registro de empresa en la UI?
> 2. **Planes SaaS**: A futuro, en un SaaS se manejan suscripciones. ¿Quieres que dejemos una columna `plan` o `fechaVencimiento` en la tabla de empresas desde ahora, o lo omitimos para el MVP?

## Proposed Changes (SaaS Architecture)

### 1. Database Schema (`src/database/schema/schema.ts`)

Para lograr la separación de inquilinos (Tenants), crearemos la tabla base `empresas` y vincularemos el resto de la jerarquía.

- **[NEW] `tbempresas`**: `id`, `nombre`, `subdominio` (opcional), `estado`, timestamps.
- **[MODIFY] `tbsucursales`**: Añadir `empresaId`. Una empresa tiene muchas sucursales. (El MVP usará solo 1 sucursal por empresa).
- **[MODIFY] `tbusuarios`**: Añadir `empresaId`. Un usuario pertenece a una empresa.
- **[MODIFY] Todas las entidades Core** (`tbclientes`, `tbpaquetes`, `caja_turno`, `tbconfiguracion`): 
  Añadir `empresaId`. Esto es crucial en arquitectura SaaS (Patrón *Tenant-per-row*). Modificaremos los índices únicos para que sean únicos **por empresa** (ej. `codigoPaquete` + `empresaId`).

### 2. Auth & Middleware (`src/lib/auth.ts`)

- La sesión JWT ahora deberá consultar la base de datos y almacenar el `empresaId` del usuario autenticado. 
- La aplicación utilizará este `empresaId` proveniente de la sesión en todas las operaciones CRUD (`where(eq(tabla.empresaId, session.user.empresaId))`).

---

## Fases de Desarrollo Propuestas (Adaptadas a SaaS)

### Fase 1: Core SaaS y Autenticación
- [ ] **Esquema de BD**: Agregar tabla de Empresas y propagar `empresaId` en el schema.
- [ ] **Configuración de NextAuth**: Guardar y retornar `empresaId` en el token JWT.
- [ ] **Seed**: Actualizar scripts para generar un tenant de prueba.
- [ ] **Página de Login**: Autenticación con verificación de estado activo del tenant.

### Fase 2: Gestión de Catálogos (Aislados por Tenant)
- [ ] **Módulo de Sucursales**: CRUD de sucursales filtrado por empresa. (En el MVP, el administrador gestionará 1 sucursal).
- [ ] **Módulo de Usuarios**: CRUD de empleados.
- [ ] **Módulo de Clientes**: CRUD de clientes compartidos a nivel empresa.

### Fase 3: Operaciones de Paquetería
- [ ] **Registro de Paquetes**: Formulario y listado aislando datos por `empresaId` y `sucursalId`.
- [ ] **Tracking Historial**: Gestión de estados.

### Fase 4: Control de Caja
- [ ] **Apertura y Cierre de Caja**: Flujo vinculado al cajero y la sucursal activa.
- [ ] **Gastos y Transacciones**: Egresos aislados por caja y empresa.

## Verification Plan

### Automated Tests
- Validar la generación de las nuevas migraciones con Drizzle (`pnpm db:push`).
- Verificar el aislamiento: un usuario de Empresa A no puede ver datos de Empresa B en base de datos.

### Manual Verification
- Iniciar sesión y comprobar que el JWT contiene el `empresaId`.
- Crear un paquete y verificar en BD que se guardó con el `empresaId` correcto.
