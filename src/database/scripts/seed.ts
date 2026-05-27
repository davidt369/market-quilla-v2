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
      tbtransacciones,
      tbgastos_caja,
      caja_turno,
      tbpaquetes,
      tbusuarios_roles,
      tbroles_permisos,
      tbclientes,
      tbusuarios,
      tbroles,
      tbpermisos,
      tbsucursales
    RESTART IDENTITY CASCADE;
  `);
}

async function seedSucursales() {
  const values = [
    {
      nombre: 'Sucursal Central',
      direccion: 'Av. Ayacucho #123, Centro',
      telefono: '7123456701',
    },
    {
      nombre: 'Sucursal Norte',
      direccion: 'Calle Murillo #456, Zona Norte',
      telefono: '7123456702',
    },
    {
      nombre: 'Sucursal Sur',
      direccion: 'Av. 6 de Agosto #789, Zona Sur',
      telefono: '7123456703',
    },
  ];

  return db.insert(schema.sucursales).values(values).returning();
}

async function seedRoles() {
  const values = [
    { nombreRol: 'administrador' },
    { nombreRol: 'supervisor' },
    { nombreRol: 'recepcionista' },
    { nombreRol: 'cajero' },
  ];

  return db.insert(schema.roles).values(values).returning();
}

async function seedPermisos() {
  const values = [
    { nombrePermiso: 'ver-dashboard' },
    { nombrePermiso: 'gestionar-usuarios' },
    { nombrePermiso: 'gestionar-roles' },
    { nombrePermiso: 'gestionar-clientes' },
    { nombrePermiso: 'gestionar-paquetes' },
    { nombrePermiso: 'registrar-caja' },
    { nombrePermiso: 'registrar-gastos' },
    { nombrePermiso: 'cerrar-caja' },
    { nombrePermiso: 'ver-reportes' },
  ];

  return db.insert(schema.permisos).values(values).returning();
}

async function seedUsuarios(sucursales: Array<{ id: number }>) {
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const values = [
    {
      sucursalId: sucursales[0]?.id,
      nombreCompleto: 'Admin Central',
      nombreUsuario: 'admin',
      password: hashedPassword,
      rolBase: 'administrador',
    },
    {
      sucursalId: sucursales[0]?.id,
      nombreCompleto: 'Laura Perez',
      nombreUsuario: 'laura.perez',
      password: hashedPassword,
      rolBase: 'recepcionista',
    },
    {
      sucursalId: sucursales[1]?.id,
      nombreCompleto: 'Carlos Vega',
      nombreUsuario: 'carlos.vega',
      password: hashedPassword,
      rolBase: 'cajero',
    },
    {
      sucursalId: sucursales[2]?.id,
      nombreCompleto: 'Marta Salinas',
      nombreUsuario: 'marta.salinas',
      password: hashedPassword,
      rolBase: 'supervisor',
    },
    {
      sucursalId: sucursales[1]?.id,
      nombreCompleto: 'Jorge Mamani',
      nombreUsuario: 'jorge.mamani',
      password: hashedPassword,
      rolBase: 'recepcionista',
    },
    {
      sucursalId: sucursales[2]?.id,
      nombreCompleto: 'Sofia Rojas',
      nombreUsuario: 'sofia.rojas',
      password: hashedPassword,
      rolBase: 'cajero',
    },
  ];

  return db.insert(schema.usuarios).values(values as any).returning();
}

async function seedUsuariosRoles(usuarios: Array<{ id: number }>, roles: Array<{ id: number; nombreRol: string }>) {
  const roleMap = new Map(roles.map((role) => [role.nombreRol, role.id]));

  const values = [
    { usuarioId: usuarios[0].id, rolId: roleMap.get('administrador')! },
    { usuarioId: usuarios[1].id, rolId: roleMap.get('recepcionista')! },
    { usuarioId: usuarios[2].id, rolId: roleMap.get('cajero')! },
    { usuarioId: usuarios[3].id, rolId: roleMap.get('supervisor')! },
    { usuarioId: usuarios[4].id, rolId: roleMap.get('recepcionista')! },
    { usuarioId: usuarios[5].id, rolId: roleMap.get('cajero')! },
  ];

  return db.insert(schema.usuariosRoles).values(values).returning();
}

async function seedRolesPermisos(roles: Array<{ id: number; nombreRol: string }>, permisos: Array<{ id: number; nombrePermiso: string }>) {
  const permisoMap = new Map(permisos.map((permiso) => [permiso.nombrePermiso, permiso.id]));
  const roleMap = new Map(roles.map((role) => [role.nombreRol, role.id]));

  const values = [
    ...permisos.map((permiso) => ({ rolId: roleMap.get('administrador')!, permisoId: permiso.id })),
    { rolId: roleMap.get('supervisor')!, permisoId: permisoMap.get('ver-dashboard')! },
    { rolId: roleMap.get('supervisor')!, permisoId: permisoMap.get('gestionar-paquetes')! },
    { rolId: roleMap.get('supervisor')!, permisoId: permisoMap.get('ver-reportes')! },
    { rolId: roleMap.get('recepcionista')!, permisoId: permisoMap.get('ver-dashboard')! },
    { rolId: roleMap.get('recepcionista')!, permisoId: permisoMap.get('gestionar-clientes')! },
    { rolId: roleMap.get('recepcionista')!, permisoId: permisoMap.get('gestionar-paquetes')! },
    { rolId: roleMap.get('cajero')!, permisoId: permisoMap.get('ver-dashboard')! },
    { rolId: roleMap.get('cajero')!, permisoId: permisoMap.get('registrar-caja')! },
    { rolId: roleMap.get('cajero')!, permisoId: permisoMap.get('registrar-gastos')! },
    { rolId: roleMap.get('cajero')!, permisoId: permisoMap.get('cerrar-caja')! },
  ];

  return db.insert(schema.rolesPermisos).values(values).returning();
}

async function seedClientes() {
  const values = Array.from({ length: 24 }, (_, index) => {
    const phone = String(7000000000 + index + 1);
    const ci = String(1000000000 + index + 1);

    return {
      nombreCompleto: faker.person.fullName(),
      empresa: index % 4 === 0 ? faker.company.name() : undefined,
      celular: phone,
      ci,
      contacto: faker.string.numeric(9),
    };
  });

  return db.insert(schema.clientes).values(values).returning();
}

async function seedPaquetes(
  sucursales: Array<{ id: number }>,
  usuarios: Array<{ id: number }>,
  clientes: Array<{ id: number }>,
) {
  const tipos = ['documentos', 'ropa', 'electronicos', 'regalos'];
  const estadosPago = ['pendiente', 'pagado', 'parcial'];
  const estadosPaquete = ['en almacen', 'en ruta', 'entregado'];

  const values = Array.from({ length: 18 }, (_, index) => {
    const remitente = clientes[(index * 2) % clientes.length];
    const destinatario = clientes[(index * 2 + 1) % clientes.length];

    return {
      sucursalId: sucursales[index % sucursales.length].id,
      remitenteId: remitente.id,
      destinatarioId: destinatario.id,
      usuarioId: usuarios[index % usuarios.length].id,
      codigoPaquete: `PKT-${faker.string.alphanumeric({ length: 8, casing: 'upper' })}-${index + 1}`,
      descripcion: faker.commerce.productDescription(),
      tipoPaquete: tipos[index % tipos.length],
      costo: faker.number.float({ min: 15, max: 250, fractionDigits: 2 }).toFixed(2),
      estadoPago: estadosPago[index % estadosPago.length],
      estadoPaquete: estadosPaquete[index % estadosPaquete.length],
      ubicacionPaquete: faker.location.city(),
      fotoEntregaUrl: index % 3 === 0 ? faker.image.urlPicsumPhotos() : null,
      fechaHoraRegistro: faker.date.recent({ days: 45 }),
      fechaHoraEntrega: index % 3 === 0 ? faker.date.recent({ days: 7 }) : null,
    };
  });

  return db.insert(schema.paquetes).values(values as any).returning();
}

async function seedPaqueteHistorial(
  sucursales: Array<{ id: number }>,
  usuarios: Array<{ id: number }>,
  paquetes: Array<{ id: number; estadoPaquete: string }>,
) {
  const estadosPrevios = ['registrado', 'en almacen', 'en viaje', 'en sucursal'];

  const values = paquetes.slice(0, 12).map((paquete, index) => ({
    paqueteId: paquete.id,
    estadoAnterior: estadosPrevios[index % estadosPrevios.length],
    estadoNuevo: paquete.estadoPaquete,
    observacion: faker.lorem.sentence(),
    usuarioId: usuarios[index % usuarios.length].id,
    sucursalId: sucursales[index % sucursales.length].id,
    fecha: faker.date.recent({ days: 30 }),
  }));

  return db.insert(schema.paqueteHistorial).values(values as any).returning();
}

async function seedCajaTurno(sucursales: Array<{ id: number }>, usuarios: Array<{ id: number }>) {
  const values = Array.from({ length: 5 }, (_, index) => {
    const fecha = faker.date.recent({ days: 12 }).toISOString().slice(0, 10);

    return {
      sucursalId: sucursales[index % sucursales.length].id,
      fecha,
      horaApertura: faker.date.recent({ days: 12 }),
      horaCierre: index % 2 === 0 ? faker.date.recent({ days: 1 }) : null,
      usuarioId: usuarios[index % usuarios.length].id,
      montoInicial: faker.number.float({ min: 100, max: 500, fractionDigits: 2 }).toFixed(2),
      b200: faker.number.int({ min: 0, max: 8 }),
      b100: faker.number.int({ min: 0, max: 10 }),
      b50: faker.number.int({ min: 0, max: 12 }),
      b20: faker.number.int({ min: 0, max: 20 }),
      b10: faker.number.int({ min: 0, max: 20 }),
      b5: faker.number.int({ min: 0, max: 20 }),
      m2: faker.number.int({ min: 0, max: 15 }),
      m1: faker.number.int({ min: 0, max: 20 }),
      m050: faker.number.int({ min: 0, max: 20 }),
      m020: faker.number.int({ min: 0, max: 25 }),
      m010: faker.number.int({ min: 0, max: 30 }),
      ventasEfectivo: faker.number.float({ min: 200, max: 2500, fractionDigits: 2 }).toFixed(2),
      pagosQR: faker.number.float({ min: 0, max: 1500, fractionDigits: 2 }).toFixed(2),
      totalSalidas: faker.number.float({ min: 0, max: 700, fractionDigits: 2 }).toFixed(2),
      cerrada: index % 2 === 0,
      cierreObs: index % 2 === 0 ? faker.lorem.sentence() : null,
    };
  });

  return db.insert(schema.cajaTurno).values(values).returning();
}

async function seedConfiguracion(sucursal: { id: number }) {
  return db.insert(schema.configuracion).values({
    nombreEmpresa: 'Market Quilla',
    logoUrl: faker.image.urlLoremFlickr({ category: 'business' }),
    qrUrl: faker.image.urlLoremFlickr({ category: 'qr' }),
    moneda: 'BOB',
    impuestos: '13.00',
    whatsapp: '59170000000',
    impresora: 'EPSON_TM_T20',
    ticketFooter: 'Gracias por confiar en Market Quilla',
    createdSucursalId: sucursal.id,
    updatedSucursalId: sucursal.id,
  } as any).returning();
}

async function seedGastosCaja(
  cajas: Array<{ id: number }>,
  usuarios: Array<{ id: number }>,
) {
  const metodosPago = ['efectivo', 'qr'];

  const values = Array.from({ length: 10 }, (_, index) => ({
    cajaId: cajas[index % cajas.length].id,
    usuarioId: usuarios[index % usuarios.length].id,
    descripcion: faker.commerce.productDescription(),
    metodoPago: metodosPago[index % metodosPago.length],
    monto: faker.number.float({ min: 5, max: 180, fractionDigits: 2 }).toFixed(2),
  }));

  return db.insert(schema.gastosCaja).values(values as any).returning();
}

async function seedTransacciones(
  cajas: Array<{ id: number }>,
  usuarios: Array<{ id: number }>,
  paquetes: Array<{ id: number }>,
) {
  const tipos = ['ingreso', 'egreso', 'servicio'];

  const values = Array.from({ length: 20 }, (_, index) => ({
    cajaId: cajas[index % cajas.length].id,
    usuarioId: usuarios[index % usuarios.length].id,
    paqueteId: index % 2 === 0 ? paquetes[index % paquetes.length].id : null,
    tipoTransaccion: tipos[index % tipos.length],
    monto: faker.number.float({ min: 10, max: 500, fractionDigits: 2 }).toFixed(2),
    descripcion: faker.commerce.productDescription(),
  }));

  return db.insert(schema.transacciones).values(values as any).returning();
}

async function main() {
  try {
    console.log('Limpiando tablas...');
    await resetDatabase();

    console.log('Creando sucursales, roles y permisos...');
    const sucursales = (await seedSucursales()) as Array<{ id: number }>;
    const roles = (await seedRoles()) as Array<{ id: number; nombreRol: string }>;
    const permisos = (await seedPermisos()) as Array<{ id: number; nombrePermiso: string }>;

    console.log('Creando usuarios y relaciones de seguridad...');
    const usuarios = (await seedUsuarios(sucursales)) as Array<{ id: number }>;
    await seedUsuariosRoles(usuarios, roles);
    await seedRolesPermisos(roles, permisos);

    console.log('Creando clientes y paquetes...');
    const clientes = (await seedClientes()) as Array<{ id: number }>;
    const paquetes = (await seedPaquetes(sucursales, usuarios, clientes)) as Array<{ id: number; estadoPaquete: string }>;
    await seedPaqueteHistorial(sucursales, usuarios, paquetes);

    console.log('Creando cajas, gastos y transacciones...');
    const cajas = (await seedCajaTurno(sucursales, usuarios)) as Array<{ id: number }>;
    await seedGastosCaja(cajas, usuarios);
    await seedTransacciones(cajas, usuarios, paquetes);

    console.log('Creando configuración base...');
    await seedConfiguracion(sucursales[0]);

    console.log('Seeder completado con datos de prueba.');
  } catch (error) {
    console.error('Error ejecutando el seeder:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();