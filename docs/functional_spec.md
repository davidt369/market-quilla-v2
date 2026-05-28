# Especificación Funcional Completa del Sistema (SaaS MVP)

Este documento detalla exhaustivamente la estructura de roles, páginas, formularios y la experiencia de uso diaria del sistema.

---

## 1. Arquitectura de Roles y Permisos (100% Dinámicos)

¡Sí vas a poder crear todos los roles y permisos que quieras! El sistema está diseñado para ser totalmente dinámico y personalizable.

### A. Roles Personalizados (Ilimitados)
Desde el panel de configuración, **podrás crear los roles que se te ocurran** (Ej: *"Cajero de Noche"*, *"Auditor"*, *"Gerente Regional"*). 

Por defecto, para que el sistema funcione apenas lo enciendas (sin que tengas que configurar todo desde cero), yo te dejaré pre-creados **3 Roles Base**:
1.  **Administrador:** Acceso total.
2.  **Supervisor:** Administra una sucursal específica.
3.  **Recepcionista/Cajero:** Operador de primera línea.

### B. Matriz de Permisos Dinámicos (Checkboxes)
Cuando crees un nuevo rol (Ej. *"Auditor"*), te aparecerá una pantalla con casillas de verificación (checkboxes) para que elijas exactamente qué puede y qué no puede hacer ese rol. Los permisos iniciales que crearé para ti (y a los que tú podrás agregar más en el futuro) son:

*   **Módulo Paquetes:** `paquetes.crear`, `paquetes.ver`, `paquetes.editar`, `paquetes.anular`, `paquetes.entregar`.
*   **Módulo Caja:** `caja.abrir`, `caja.cerrar`, `caja.ver_reporte`, `caja.registrar_gasto`.
*   **Módulo Clientes:** `clientes.crear`, `clientes.ver`, `clientes.editar`.
*   **Módulo Configuración:** `sucursales.gestionar`, `usuarios.gestionar`, `roles.gestionar`.

---

## 2. Mapa del Sitio (Páginas y Formularios)

### `/login` (Inicio de Sesión)
*   **Formulario:** `Usuario`, `Contraseña`.
*   **Lógica:** Verifica las credenciales. Revisa si el `usuario.estado` y `empresa.estado` están activos. Redirige a `/dashboard`.

### `/dashboard` (Panel Principal)
*   **Si eres Administrador:** 
    *   Muestra: Gráficas de ingresos globales, total de paquetes movidos hoy, métricas comparativas entre sucursales.
    *   Header: Selector (Dropdown) para filtrar los gráficos por sucursal específica o ver el global.
*   **Si eres Cajero:** 
    *   Lógica del **"Candado de Turno"**: Si no tiene caja abierta, la pantalla está borrosa/bloqueada.
    *   **Formulario Modal (Apertura de Caja):** Un input simple: `Monto Inicial en Efectivo (Cambio)`.
    *   Si la caja está abierta: Muestra un resumen rápido de su turno (Ej: Efectivo Actual: 350 Bs, QR: 100 Bs).

### `/dashboard/paquetes/nuevo` (Recepción de Paquetes)
*   **Formulario (Optimizado para Velocidad):**
    *   **Sección 1 (Personas):** Input `Celular Remitente`. (Autocompleta nombre y CI si existe. Si no, muestra campos extra para crearlo). Lo mismo para `Destinatario`.
    *   **Sección 2 (Paquete):** Dropdown `Tipo` (Sobre, Caja, Otro), Input `Descripción`, Dropdown `Destino` (Sucursal B).
    *   **Sección 3 (Pago):** Input `Costo Total`, Dropdown `Método de Pago` (Efectivo/QR).
*   **Lógica:** Al dar en "Guardar", se inyecta silenciosamente su `sucursalId` y su `empresaId`. Se genera un registro financiero asociado a su `cajaId` abierta. Se imprime un ticket.

### `/dashboard/paquetes/entregar` (Punto de Entrega)
*   **Formulario:** Input gigante centrado: `Código de Seguimiento` (Preparado para lector de código de barras).
*   **Lógica:** Al detectar el código, muestra los detalles del paquete. Un único botón verde gigante: **"Confirmar Entrega"**. Cambia el estado a `entregado` en el historial.

### `/dashboard/caja` (Gestión de Efectivo)
*   **Gastos de Caja (Formulario):** `Monto`, `Motivo` (Ej. Compra de cinta), `Tipo` (Efectivo/QR). Se resta del saldo actual.
*   **Cierre de Caja (Formulario de Arqueo):**
    *   Muestra: `Lo que el sistema calculó: 450 Bs en Efectivo`.
    *   Inputs: Desglose de billetes (Billetes de 200, 100, 50, Monedas).
    *   Textarea: `Observaciones por faltantes/sobrantes`.
*   **Lógica:** Al confirmar, la caja marca `cerrada = true`. El empleado ya no puede hacer operaciones hasta el día siguiente.

### `/dashboard/configuracion` (Solo Admins)
*   **Pestaña Sucursales:** Formulario (`Nombre`, `Dirección`, `Teléfono`).
*   **Pestaña Personal:** Formulario (`Nombre`, `Usuario`, `Password`, `Rol`, `Sucursal Asignada`).
*   **Pestaña Roles:** Matriz de Seguridad. Lista de roles creados y checkboxes al lado de cada permiso mencionado en la sección 1 para armar reglas a medida.

---

## 3. El Viaje del Usuario (Cómo funcionará en la vida real)

### El Día 1 (El Administrador / Dueño)
1. El Administrador recibe sus credenciales. Entra a `/login`.
2. Ve su Panel Global vacío. Va directo a **Configuración**.
3. Crea sus sucursales: *"Sucursal La Paz"* y *"Sucursal El Alto"*.
4. Va a Personal y crea a sus cajeros: *"Juan"* (para La Paz) y *"María"* (para El Alto).

### El Día a Día (El Operador / Cajero)
1. **08:00 AM:** Juan (Cajero) llega a la Sucursal La Paz. Entra al sistema. El sistema le bloquea el paso exigiendo abrir caja. Juan ingresa que empieza con 50 Bs de monedas para dar cambio.
2. **09:30 AM:** Llega un cliente enviando ropa a El Alto. Juan va a "Registrar Paquete". Escribe el celular, llena la descripción, cobra 20 Bs en efectivo. **(El sistema sabe mágicamente que Juan está en La Paz, y registra los 20 Bs a la caja de Juan, no a la de María).**
3. **14:00 PM:** Juan compra hojas para la impresora. Entra a "Gastos de Caja", registra una salida de 10 Bs.
4. **18:00 PM:** Termina el turno. Juan va a "Cierre de Caja". El sistema dice que debe tener 60 Bs en efectivo (50 inicio + 20 paquete - 10 hojas). Juan introduce los billetes que tiene, confirma, y se va a casa. El sistema queda bloqueado esperando la apertura de caja de mañana.
