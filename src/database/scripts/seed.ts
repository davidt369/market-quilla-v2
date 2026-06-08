import 'dotenv/config';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { Pool } from 'pg';
import * as schema from '../schema/schema';

faker.seed(20260525);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function resetDatabase() {
  await db.execute(sql`
    TRUNCATE TABLE
      tbauditoria,
      tbcaja_movimientos,
      tbcaja_turnos,
      tbpaquete_historial,
      tbpaquetes,
      tbusuarios_roles,
      tbroles_permisos,
      tbclientes,
      tbconfiguracion,
      tbusuarios,
      tbroles,
      tbpermisos,
      tbsucursales,
      tbempresas
    RESTART IDENTITY CASCADE;
  `);
}

async function seedEmpresas() {
  const values = [
    {
      nombre: 'Market Quilla by MisterSofts',
      subdominio: 'marketquilla',
      activo: true,
    },
  ];
  // Asumiendo que definiste 'tbempresas' en el schema
  return db.insert(schema.tbempresas).values(values).returning();
}

async function seedSucursales(empresaId: number) {
  const values = [
    {
      fk_id_empresa: empresaId,
      nombre: 'Sucursal Cochabamba Centro',
      direccion: 'Av. Ayacucho #123, Centro',
      activo: true,
    },
    {
      fk_id_empresa: empresaId,
      nombre: 'Sucursal Quillacollo',
      direccion: 'Plaza Principal #456',
      activo: true,
    },
  ];

  return db.insert(schema.tbsucursales).values(values).returning();
}

async function seedUsuarios() {
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const values = [
    {
      nombre_completo: 'David Admin',
      nombre_usuario: 'admin',
      email: 'admin@mistersofts.local',
      password_hash: hashedPassword,
    },
    {
      nombre_completo: 'Laura Perez',
      nombre_usuario: 'laura.perez',
      email: 'laura@marketquilla.local',
      password_hash: hashedPassword,
    },
    {
      nombre_completo: 'Carlos Vega',
      nombre_usuario: 'carlos.vega',
      email: 'carlos@marketquilla.local',
      password_hash: hashedPassword,
    },
  ];

  return db.insert(schema.tbusuarios).values(values).returning();
}

async function seedClientes() {
  const tiposCliente = ['persona', 'empresa'];

  const values = Array.from({ length: 24 }, (_, index) => {
    const isEmpresa = index % 4 === 0;

    return {
      tipoCliente: isEmpresa ? 'empresa' : 'persona',
      nombre_completo: faker.person.fullName(),
      empresa: isEmpresa ? faker.company.name() : null, // Campo para la etiqueta
      celular: String(70000000 + index + 1), // Celulares locales
      ci: String(1000000 + index + 1),
      observaciones: index % 5 === 0 ? 'Cliente frecuente' : null,
    };
  });

  return db.insert(schema.tbclientes).values(values).returning();
}

async function seedPaquetes(
  sucursales: Array<{ pk_id_sucursal: number }>,
  usuarios: Array<{ pk_id_usuario: number }>,
  clientes: Array<{ pk_id_cliente: number }>
) {
  const tipos = ['documentos', 'ropa', 'electronicos', 'repuestos'];
  // Enums exactos definidos en el schema
  const estadosPago = ['pendiente', 'pagado', 'parcial', 'anulado'];
  const estadosPaquete = ['registrado', 'en_almacen', 'entregado', 'devuelto'];
  const momentosPago = ['al_registrar', 'al_entregar'];

  const values = Array.from({ length: 18 }, (_, index) => {
    const remitente = clientes[(index * 2) % clientes.length];
    const destinatario = clientes[(index * 2 + 1) % clientes.length];
    const estadoActual = estadosPaquete[index % estadosPaquete.length];

    return {
      fk_id_remitente: remitente.pk_id_cliente,
      fk_id_destinatario: destinatario.pk_id_cliente,
      fk_id_usuario: usuarios[index % usuarios.length].pk_id_usuario,

      codigoPaquete: `LUN-${String(index + 1).padStart(3, '0')}`,
      ubicacionAlmacen: `MT/${faker.number.int({ min: 1, max: 5 })}/${faker.number.int({ min: 100, max: 999 })}`, // Para la ficha amarilla

      descripcion: faker.commerce.productDescription(),
      tipoPaquete: tipos[index % tipos.length],
      peso: faker.number.float({ min: 0.5, max: 20, fractionDigits: 2 }).toString(),
      costoEnvio: faker.number.float({ min: 15, max: 150, fractionDigits: 2 }).toString(), // En Drizzle es mejor pasar Numeric como string

      estadoPago: estadosPago[index % estadosPago.length],
      momentoPago: momentosPago[index % momentosPago.length], // Regla de negocio
      estadoPaquete: estadoActual,

      fotoEntregadoUrl: estadoActual === 'entregado' ? faker.image.urlPicsumPhotos() : null,
      fechaHoraRegistro: faker.date.recent({ days: 15 }),
      fechaHoraEntrega: estadoActual === 'entregado' ? faker.date.recent({ days: 2 }) : null,
    };
  });

  return db.insert(schema.tbpaquetes).values(values).returning();
}

async function seedCajaTurnos(usuarios: Array<{ pk_id_usuario: number }>) {
  const values = Array.from({ length: 5 }, (_, index) => {
    const isCerrada = index % 2 === 0;

    return {
      fk_id_usuario: usuarios[index % usuarios.length].pk_id_usuario,
      fecha: faker.date.recent({ days: 5 }).toISOString().slice(0, 10),
      horaApertura: faker.date.recent({ days: 5 }),
      horaCierre: isCerrada ? faker.date.recent({ days: 1 }) : null,
      montoInicial: faker.number.float({ min: 100, max: 500, fractionDigits: 2 }).toString(),
      montoFinal: isCerrada ? faker.number.float({ min: 500, max: 2000, fractionDigits: 2 }).toString() : null,
      cerrada: isCerrada,
    };
  });

  return db.insert(schema.tbcajaTurnos).values(values).returning();
}

async function seedMovimientosCaja(
  cajas: Array<{ pk_id_cajaTurno: number }>,
  usuarios: Array<{ pk_id_usuario: number }>,
  paquetes: Array<{ pk_id_paquete: number }>
) {
  // Enums exactos
  const tiposMovimiento = ['ingreso', 'egreso'];
  const metodosPago = ['efectivo', 'qr', 'transferencia']; // Adaptado para QR Simple

  const values = Array.from({ length: 20 }, (_, index) => ({
    fk_id_cajaTurno: cajas[index % cajas.length].pk_id_cajaTurno,
    fk_id_usuario: usuarios[index % usuarios.length].pk_id_usuario,
    fk_id_paquete: index % 2 === 0 ? paquetes[index % paquetes.length].pk_id_paquete : null,

    tipoMovimiento: tiposMovimiento[index % tiposMovimiento.length],
    metodoPago: metodosPago[index % metodosPago.length],

    monto: faker.number.float({ min: 10, max: 250, fractionDigits: 2 }).toString(),
    descripcion: index % 2 === 0 ? 'Pago de envío de paquete' : 'Compra de material de escritorio',
  }));

  return db.insert(schema.tbcajaMovimientos).values(values).returning();
}

async function main() {
  try {
    console.log('Limpiando tablas...');
    await resetDatabase();

    console.log('Creando empresa y sucursales...');
    const empresas = await seedEmpresas();
    const sucursales = await seedSucursales(empresas[0].pk_id_empresa);

    console.log('Creando usuarios base...');
    const usuarios = await seedUsuarios();

    console.log('Creando clientes...');
    const clientes = await seedClientes();

    console.log('Creando paquetes (con ubicaciones para etiquetas)...');
    const paquetes = await seedPaquetes(sucursales, usuarios, clientes);

    console.log('Generando turnos de caja y movimientos financieros...');
    const cajas = await seedCajaTurnos(usuarios);
    await seedMovimientosCaja(cajas, usuarios, paquetes);

    console.log('✅ Seeder completado con éxito.');
  } catch (error) {
    console.error('❌ Error ejecutando el seeder:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();