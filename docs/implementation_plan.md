# Plan de Implementación: MVP Market Quilla

Este documento detalla la hoja de ruta para desarrollar los módulos principales necesarios para que el MVP (Producto Mínimo Viable) funcione correctamente en producción. La estructura está basada en el esquema de la base de datos actual.

## User Review Required

Por favor revisa el orden de prioridad de los módulos. El orden actual asume que no podemos registrar paquetes sin clientes, y no podemos registrar transacciones sin una caja abierta. ¿Estás de acuerdo con este flujo?

## Open Questions

> [!IMPORTANT]
> 1. **Autenticación**: Veo que tienes `next-auth` y `bcrypt` en tus dependencias. ¿Usaremos NextAuth (Auth.js) v5 con un proveedor de credenciales personalizadas?
> 2. **Impresión de Tickets**: La base de datos guarda configuración de impresoras (ej: `EPSON_TM_T20`). ¿La impresión de tickets se hará desde el navegador hacia una impresora térmica conectada al cliente?
> 3. **Roles**: ¿El MVP debe restringir la visibilidad de los módulos según el rol desde el inicio, o primero armamos todos los CRUDs funcionales y luego aplicamos los candados de seguridad?

---

## Fases de Desarrollo Propuestas

### Fase 1: Core de Seguridad y Autenticación
Esta es la base de la pirámide. No podemos registrar qué usuario hizo qué acción si no hay sesión.

- [ ] **Configuración de NextAuth**: Integrar Auth.js con Drizzle.
- [ ] **Página de Login**: UI de inicio de sesión con validación de credenciales (usando `bcrypt` contra la tabla `tbusuarios`).
- [ ] **Layout Protegido**: Middleware para redirigir a `/login` si no hay sesión. Sidebar base.
- [ ] **Gestión de Configuración**: Vista sencilla para que el Administrador edite datos básicos de la empresa.

### Fase 2: Gestión de Catálogos Base
Los datos necesarios antes de poder realizar operaciones transaccionales.

- [ ] **Módulo de Sucursales**: CRUD de sucursales.
- [ ] **Módulo de Usuarios**: CRUD para registrar empleados y asignarles roles.
- [ ] **Módulo de Clientes**: CRUD de clientes con búsqueda rápida (remitentes/destinatarios).

### Fase 3: Operaciones de Paquetería (Core del Negocio)
El flujo principal de envío y recepción.

- [ ] **Registro de Paquetes**: Formulario de creación (Remitente, Destinatario, tipo, costo, estado).
- [ ] **Listado y Seguimiento**: Tabla interactiva con filtros.
- [ ] **Tracking Historial**: Interfaz para actualizar el estado del paquete, alimentando `PaqueteHistorial`.

### Fase 4: Control de Caja y Finanzas
Indispensable para el control del dinero en producción.

- [ ] **Apertura de Caja**: Iniciar turno ingresando montos y billetes base.
- [ ] **Registro de Gastos**: Módulo de egresos en caja.
- [ ] **Cierre de Caja (Arqueo)**: Pantalla de conciliación final del turno.
- [ ] **Historial de Transacciones**: Tabla con flujo de ingresos/egresos.

### Fase 5: Reportes y Pulido Final
- [ ] **Dashboard Principal**: Tarjetas resumen (Paquetes de hoy, Ingresos).
- [ ] **Tickets de Recibo**: Vista optimizada para impresión térmica.

---

## Verification Plan

### Automated Tests
- Ejecutar validaciones `tsc` y `biome check`.
- Verificar consistencia de base de datos usando `pnpm db:seed`.

### Manual Verification
- Pruebas E2E manuales del flujo: *Login -> Abrir Caja -> Registrar Cliente -> Registrar Paquete -> Cerrar Caja*.
