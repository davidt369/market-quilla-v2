# Reglas de Negocio: Gestión de Precios y Penalizaciones

Este documento detalla la lógica matemática y de negocio implementada en el sistema **Market Quilla** para el cobro de paquetes, ofertas, almacenaje y recargos por mora.

Todas estas reglas están centralizadas en la función utilitaria `calcularPrecioFinal` ubicada en `src/features/paquetes/lib/paquetes.utils.ts`.

---

## 1. Zona Horaria y Sincronización de Días
El sistema utiliza estrictamente la **Zona Horaria de Bolivia (UTC-4)** para todos los cálculos de días transcurridos.
- Para evitar falsos positivos por la hora del servidor en la nube, todas las fechas se convierten al día calendario local a las `00:00:00`.
- Esto garantiza que un paquete registrado a las 23:00 hrs cuente un día de almacenaje completo recién al cruzar la medianoche en Bolivia, protegiendo al cliente de recargos prematuros.

---

## 2. Lógica del "Precio Oferta"

La opción de "Precio Oferta" es un beneficio exclusivo otorgado a los clientes por pagar el almacenaje de forma adelantada.

### A. Condiciones para la Oferta
1. **Pago Inmediato Obligatorio:** Si al registrar un paquete se asigna un Precio Oferta (ej. 5 Bs por 2 días), este **solo aplica si el cliente elige "Pagar al Registrar"** (`estadoPago === "pagado"`). 
2. **Anulación por Falta de Pago:** Si el cliente elige "Pagar al recoger" (`estadoPago === "pendiente"`), el Precio Oferta queda automáticamente anulado desde el primer segundo. El sistema asume el **Precio Base** y comenzará a aplicar la regla de duplicación semanal normal.

### B. Dentro del Periodo de Gracia
- Si el cliente pagó el Precio Oferta por adelantado, su saldo pendiente será **0 Bs** mientras esté dentro del límite de días acordado (ej. Días 1 y 2). 
- Puede recoger el paquete sin costo adicional.

### C. Penalización Implacable por Vencimiento
Si el paquete supera el límite de días de la oferta (ej. llega el Día 3), el sistema aplica el siguiente castigo financiero:
1. **Pérdida del Dinero Adelantado:** El pago inicial hecho por el Precio Oferta se considera "perdido/caducado" como beneficio amortizable.
2. **Nueva Deuda (Precio Base):** Se genera automáticamente una nueva deuda para el paquete, cuyo valor de inicio es exactamente el **Precio Base**.
3. **Cobro Exacto en Caja:** Al entregar un paquete recién vencido, la caja solicitará cobrar físicamente el **Precio Base completo** (ej. 3 Bs). En la base de datos se registrará este cobro exacto para garantizar el cuadre de arqueo del cajero (evitando que el sistema mezcle el dinero físico cobrado hoy con el dinero cobrado hace 2 días).
4. **Acumulación Semanal:** A partir de este vencimiento, el nuevo monto (Precio Base) entrará en la regla de duplicación cada semana transcurrida.

---

## 3. Lógica del "Precio Base" (Almacenaje Regular sin Oferta)

Cuando no se utiliza un Precio Oferta, el sistema funciona de manera estándar y lineal:

1. **Semana 0 (Días 0 al 6):** El precio final es equivalente al **Precio Base**.
   - Si pagó al registrar: Saldo Pendiente = 0 Bs.
   - Si no pagó: Saldo Pendiente = Precio Base.
2. **Semanas Posteriores (Duplicación Exponencial):**
   - Cada semana transcurrida (`semanasPasadas = 1, 2, 3...`), el costo histórico total del paquete se duplica usando la fórmula: `PrecioBase * (2 ^ SemanasPasadas)`.
   - Si el cliente pagó adelantado, **ese pago sí es amortizado** de la deuda total.
   - Ejemplo (Base 5 Bs, Pagado por adelantado):
     - **Semana 1:** Costo total 10 Bs. Menos 5 Bs adelantados = **Deuda a cobrar: 5 Bs.**
     - **Semana 2:** Costo total 20 Bs. Menos 5 Bs adelantados = **Deuda a cobrar: 15 Bs.**

---

## 4. Cuadre de Caja (Modal y Cajeros)
El sistema protege al cajero de descuidos o matemáticas complejas.

- El **Saldo Pendiente** calculado en la lógica es la verdad absoluta. Ese monto es lo que aparece en el botón grande del Modal de Entrega (`Cobro de Multa / Saldo Restante`).
- Al confirmar la entrega, la base de datos de movimientos (`tbcajaMovimientos`) registra exclusivamente el **Saldo Pendiente real ingresado ese día**, asegurando que el dinero físico en el cajón sea exactamente igual a lo reportado al final del turno.
