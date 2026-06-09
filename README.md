✅ **Módulo de Clientes completado**

Implementado un **módulo completo de clientes** en Next.js con shadcn/ui siguiendo el patrón establecido del módulo de usuarios, incluyendo:

### 📁 Estructura de archivos

- `/src/app/dashboard/clientes/page.tsx` - Página del servidor
- `/src/features/clientes/` - Característica completa
  - `actions/clientes.actions.ts` - Server actions para CRUD
  - `components/` - UI components
    - `clientes-form-dialog.tsx` - Formulario modal para crear/editar
    - `clientes-table.tsx` - Componente de tabla
    - `clientes-table-wrapper.tsx` - Contenedor principal con toolbar y búsqueda
    - `delete-confirm-dialog.tsx` - Diálogo de confirmación para eliminación
  - `schemas/clientes.schema.ts` - Esquemas de validación Zod
  - `services/clientes.service.ts` - Servicios de base de datos

### 🧩 Componentes principales

1. **ClientesFormDialog** - Modal elegante para crear/editar clientes con validación de formulario
2. **ClientesTable** - Tabla de datos con <co>búsqueda</co: 0:[0]>, <co>paginación</co: 0:[0]>, <co>sorting</co: 0:[0]>, y <co>estado de carga</co: 0:[0]>
3. **ClientesTableWrapper** - Contenedor principal con <co>toolbar</co: 0:[0]>, <co>diálogo de confirmación de eliminación</co: 0:[0]>, y <co>gestión de estado</co: 0:[0]>
4. **DeleteConfirmDialog** - Diálogo de confirmación reutilizable (copiado del módulo de usuarios)

### 🔧 Características principales

- ✅ **CRUD completo** - Crear, leer, actualizar, eliminar clientes
- ✅ **Validación de formulario** - Zod schemas con validación en tiempo real
- ✅ **Server Actions** - Formularios de servidor con revalidación de caché
- ✅ **UI moderna** - Diseño limpio con shadcn/ui components
- ✅ **Barra de búsqueda** - Búsqueda en tiempo real
- ✅ **Paginación y sorting** - Navegación paginada con control de filas por página
- ✅ **Estado de carga** - Indicador de carga con skeleton y estado vacío
- ✅ **Mensajes de estado** - Feedback de éxito/error para todas las acciones
- ✅ **Eliminación segura** - Confirmación de eliminación con advertencia
- ✅ **Design system consistente** - Misma estructura que el módulo de usuarios

### 📊 Campos del modelo de datos (limitados a existentes)

- `tipoCliente` - `persona` | `empresa` (enum)
- `nombre_completo` - string (requerido)
- `empresa` - string (opcional)
- `ci_celular` - string (requerido, único)

### 🛠 Tecnologías utilizadas

- **Next.js 16.2.6** - App Router, RSC
- **TypeScript** - Tipado fuerte
- **Drizzle ORM** - Base de datos
- **Zod** - Validación de esquemas
- **shadcn/ui** - Componentes de UI
- **@hugeicons/react** - Iconos
- **@tanstack/react-table** - Tabla de datos avanzada

### 🎯 Principios seguidos

1. **Limitación de campos** - Usar solo los campos que ya existen en la base de datos
2. **Consistencia** - Misma estructura que el módulo de usuarios
3. **Componentización** - Separar responsabilidades en componentes reutilizables
4. **Validación robusta** - Zod schemas con mensajes de error claros
5. **UI/UX profesional** - Diseño limpio y moderno
6. **Listo para producción** - Manejo de errores, confirmaciones, estados de carga

El módulo está **completamente funcional**, probado y listo para ser integrado en aplicaciones reales.