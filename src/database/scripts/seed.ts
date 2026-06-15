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

      codigoPaquete: `LUN-${String(index + 1).padStart(3, "0")}`,
      ubicacionAlmacen: `MT/${faker.number.int({ min: 1, max: 5 })}/${faker.number.int({ min: 100, max: 999 })}`, // Para la ficha amarilla

      descripcion: faker.commerce.productDescription(),
      tipoPaquete: tipos[index % tipos.length],
      peso: faker.number
        .float({ min: 0.5, max: 20, fractionDigits: 2 })
        .toString(),
      costoEnvio: faker.number
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

    console.log("Creando usuarios base...");
    const usuarios = await seedUsuarios();

    console.log("Creando clientes...");
    const clientes = await seedClientes();

    console.log("Creando paquetes...");
    const paquetes = await seedPaquetes(usuarios, clientes);



    console.log("✅ Seeder completado con éxito.");
  } catch (error) {
    console.error("❌ Error ejecutando el seeder:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();