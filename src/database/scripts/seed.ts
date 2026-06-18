import "dotenv/config";
import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";
import { drizzle } from "drizzle-orm/node-postgres";
import { reset } from "drizzle-seed";
import { Pool } from "pg";
import * as schema from "../schema/schema";

faker.seed(20260525);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function seedUsuarios() {
  const hashedPassword = await bcrypt.hash("123", 10);

  const values = [
    {
      nombre_completo: "David Admin",
      nombre_usuario: "admin",
      password_hash: hashedPassword,
      rol: "administrador" as const,
    },
    {
      nombre_completo: "Maria Supervisor",
      nombre_usuario: "maria.supervisor",
      password_hash: hashedPassword,
      rol: "supervisor" as const,
    },
    {
      nombre_completo: "Laura Perez",
      nombre_usuario: "laura.perez",
      password_hash: hashedPassword,
      rol: "recepcionista" as const,
    },
    {
      nombre_completo: "Carlos Vega",
      nombre_usuario: "carlos.vega",
      password_hash: hashedPassword,
      rol: "cajero" as const,
    },
  ];

  return db.insert(schema.tbusuarios).values(values).returning();
}

async function seedClientes() {
  const values = Array.from({ length: 24 }, (_, index) => {
    const isEmpresa = index % 4 === 0;

    return {
      nombre_completo: faker.person.fullName(),
      empresa: isEmpresa ? faker.company.name() : null, // Campo para la etiqueta
      ci_o_cel: String(70000000 + index + 1), // Celulares locales
      ci: String(1000000 + index + 1),
    };
  });

  return db.insert(schema.tbclientes).values(values).returning();
}

async function seedPaquetes(
  usuarios: Array<{ pk_id_usuario: number }>,
  clientes: Array<{ pk_id_cliente: number }>,
) {
  const tipos = ["documentos", "ropa", "electronicos", "repuestos"] as const;
  // Enums exactos definidos en el schema
  const estadosPago = ["pendiente", "pagado"] as const;
  const estadosPaquete = [
    "registrado",
    "entregado",
  ] as const;
  const momentosPago = ["al_registrar", "al_entregar"] as const;

  const values = Array.from({ length: 18 }, (_, index) => {
    const remitente = clientes[(index * 2) % clientes.length];
    const destinatario = clientes[(index * 2 + 1) % clientes.length];
    const estadoActual = estadosPaquete[index % estadosPaquete.length];

    return {
      fk_id_remitente: remitente.pk_id_cliente,
      fk_id_destinatario: destinatario.pk_id_cliente,
      fk_id_usuario: usuarios[index % usuarios.length].pk_id_usuario,

      ubicacionAlmacen: `MT/${faker.number.int({ min: 1, max: 5 })}/${faker.number.int({ min: 100, max: 999 })}`, // Para la ficha amarilla
      tipoPaquete: tipos[index % tipos.length],
      precioBase: faker.number
        .float({ min: 15, max: 150, fractionDigits: 2 })
        .toString(), // En Drizzle es mejor pasar Numeric como string

      estadoPago: estadosPago[index % estadosPago.length],
      momentoPago: momentosPago[index % momentosPago.length], // Regla de negocio
      estadoPaquete: estadoActual,

      fotoEntregadoUrl:
        estadoActual === "entregado" ? faker.image.urlPicsumPhotos() : null,
      fechaHoraRegistro: faker.date.recent({ days: 15 }),
      fechaHoraEntrega:
        estadoActual === "entregado" ? faker.date.recent({ days: 2 }) : null,
    };
  });

  return db.insert(schema.tbpaquetes).values(values).returning();
}

async function seedPermisos() {
  await db.delete(schema.tbroles_permisos);
  await db.delete(schema.tbpermisos);

  const permisos = [
    { pk_id_permiso: "ver-dashboard", nombre: "Ver Dashboard", descripcion: "Acceder al panel principal", modulo: "dashboard" },
    { pk_id_permiso: "acceso-caja", nombre: "Acceso a Caja", descripcion: "Ver la página de caja", modulo: "caja" },
    { pk_id_permiso: "abrir-caja", nombre: "Abrir Caja", descripcion: "Iniciar un turno de caja", modulo: "caja" },
    { pk_id_permiso: "cerrar-caja", nombre: "Cerrar Caja", descripcion: "Cerrar el turno de caja propio", modulo: "caja" },
    { pk_id_permiso: "cerrar-caja-otros", nombre: "Cerrar Caja de Otros", descripcion: "Cerrar turnos de otros usuarios", modulo: "caja" },
    { pk_id_permiso: "registrar-movimiento-manual", nombre: "Movimientos Manuales", descripcion: "Registrar ingresos/egresos manuales en caja", modulo: "caja" },
    { pk_id_permiso: "realizar-arqueo", nombre: "Realizar Arqueo", descripcion: "Hacer conteo de efectivo durante el turno", modulo: "caja" },
    { pk_id_permiso: "registrar-paquete", nombre: "Registrar Paquete", descripcion: "Crear nuevos paquetes en el sistema", modulo: "paquetes" },
    { pk_id_permiso: "editar-paquete", nombre: "Editar Paquete", descripcion: "Modificar paquetes existentes", modulo: "paquetes" },
    { pk_id_permiso: "eliminar-paquete", nombre: "Eliminar Paquete", descripcion: "Anular/eliminar paquetes", modulo: "paquetes" },
    { pk_id_permiso: "entregar-paquete", nombre: "Entregar Paquete", descripcion: "Marcar paquete como entregado", modulo: "paquetes" },
    { pk_id_permiso: "ver-paquetes-sin-entregar", nombre: "Ver Paquetes Pendientes", descripcion: "Ver paquetes sin entregar", modulo: "paquetes" },
    { pk_id_permiso: "ver-todos-paquetes", nombre: "Ver Todos los Paquetes", descripcion: "Ver lista completa de paquetes", modulo: "paquetes" },
    { pk_id_permiso: "gestionar-clientes", nombre: "Gestionar Clientes", descripcion: "Crear, editar y eliminar clientes", modulo: "clientes" },
    { pk_id_permiso: "ver-usuarios", nombre: "Ver Usuarios", descripcion: "Ver listado de usuarios", modulo: "usuarios" },
    { pk_id_permiso: "gestionar-usuarios", nombre: "Gestionar Usuarios", descripcion: "Crear, editar y eliminar usuarios", modulo: "usuarios" },
    { pk_id_permiso: "configurar-permisos", nombre: "Configurar Permisos", descripcion: "Acceder a la matriz de permisos", modulo: "configuracion" },
  ];

  await db.insert(schema.tbpermisos).values(permisos).onConflictDoNothing();

  const defaultAssignments: Record<string, string[]> = {
    administrador: permisos.map(p => p.pk_id_permiso),
    supervisor: [
      "ver-dashboard", "acceso-caja", "abrir-caja", "cerrar-caja",
      "cerrar-caja-otros", "registrar-movimiento-manual", "realizar-arqueo",
      "registrar-paquete", "editar-paquete", "eliminar-paquete",
      "entregar-paquete", "ver-paquetes-sin-entregar", "ver-todos-paquetes",
      "gestionar-clientes", "ver-usuarios",
    ],
    cajero: [
      "ver-dashboard", "acceso-caja", "abrir-caja", "cerrar-caja",
      "registrar-movimiento-manual", "realizar-arqueo",
      "entregar-paquete", "ver-paquetes-sin-entregar",
    ],
    recepcionista: [
      "ver-dashboard",
      "registrar-paquete", "editar-paquete", "ver-paquetes-sin-entregar",
      "gestionar-clientes",
    ],
  };

  for (const [rol, permisosList] of Object.entries(defaultAssignments)) {
    const assignments = permisosList.map(permiso => ({
      rol: rol as "administrador" | "supervisor" | "recepcionista" | "cajero",
      fk_id_permiso: permiso,
      activo: true,
    }));
    await db.insert(schema.tbroles_permisos).values(assignments).onConflictDoNothing();
  }
}

// async function seedCajaTurnos(usuarios: Array<{ pk_id_usuario: number }>) {
//   const values = Array.from({ length: 5 }, (_, index) => {
//     const isCerrada = index % 2 === 0;

//     return {
//       fk_id_usuario: usuarios[index % usuarios.length].pk_id_usuario,
//       fecha: faker.date.recent({ days: 5 }).toISOString().slice(0, 10),
//       horaApertura: faker.date.recent({ days: 5 }),
//       horaCierre: isCerrada ? faker.date.recent({ days: 1 }) : null,
//       montoInicial: faker.number
//         .float({ min: 100, max: 500, fractionDigits: 2 })
//         .toString(),
//       montoFinal: isCerrada
//         ? faker.number
//           .float({ min: 500, max: 2000, fractionDigits: 2 })
//           .toString()
//         : null,
//       cerrada: isCerrada,
//     };
//   });

//   return db.insert(schema.tbcajaTurnos).values(values).returning();
// }

// async function seedMovimientosCaja(
//   cajas: Array<{ pk_id_cajaTurno: number }>,
//   usuarios: Array<{ pk_id_usuario: number }>,
//   paquetes: Array<{ pk_id_paquete: number }>,
// ) {
//   // Enums exactos
//   const tiposMovimiento = ["ingreso", "egreso"] as const;
//   const metodosPago = ["efectivo", "qr"] as const; // Adaptado para QR Simple

//   const values = Array.from({ length: 20 }, (_, index) => ({
//     fk_id_cajaTurno: cajas[index % cajas.length].pk_id_cajaTurno,
//     fk_id_usuario: usuarios[index % usuarios.length].pk_id_usuario,
//     fk_id_paquete:
//       index % 2 === 0 ? paquetes[index % paquetes.length].pk_id_paquete : null,

//     tipoMovimiento: tiposMovimiento[index % tiposMovimiento.length],
//     metodoPago: metodosPago[index % metodosPago.length],

//     monto: faker.number
//       .float({ min: 10, max: 250, fractionDigits: 2 })
//       .toString(),
//     descripcion:
//       index % 2 === 0
//         ? "Pago de envío de paquete"
//         : "Compra de material de escritorio",
//   }));

//   return db.insert(schema.tbcajaMovimientos).values(values).returning();
// }

async function main() {
  try {
    console.log("Limpiando tablas con drizzle-seed...");
    await reset(db, schema);

    console.log("Creando permisos...");
    await seedPermisos();

    console.log("Creando usuarios base...");
    const usuarios = await seedUsuarios();

    console.log("Creando clientes...");
    const clientes = await seedClientes();

    console.log("Creando paquetes...");
    await seedPaquetes(usuarios, clientes);

    console.log("✅ Seeder completado con éxito.");
  } catch (error) {
    console.error("❌ Error ejecutando el seeder:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();