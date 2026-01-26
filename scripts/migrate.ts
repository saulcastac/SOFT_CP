import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Check if tables exist
    try {
        const result = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name='Tractocamion';`;
        console.log('Existing tables:', result);

        if (Array.isArray(result) && result.length === 0) {
            console.log('Creating tables...');

            // Create Tractocamion table
            await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Tractocamion" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "customId" TEXT NOT NULL UNIQUE,
          "marca" TEXT NOT NULL,
          "subMarca" TEXT,
          "modelo" TEXT NOT NULL,
          "placa" TEXT NOT NULL UNIQUE,
          "kilometrajeInicial" REAL,
          "pesoBrutoVehicular" REAL NOT NULL,
          "color" TEXT,
          "vin" TEXT,
          "ejesTraseros" INTEGER,
          "configuracionVehicular" TEXT,
          "subtipoRemolque" TEXT,
          "aseguradora" TEXT,
          "numeroPoliza" TEXT,
          "vigenciaPoliza" DATETIME,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL
        );
      `);

            // Create Plataforma table
            await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Plataforma" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "customId" TEXT NOT NULL UNIQUE,
          "marca" TEXT NOT NULL,
          "subMarca" TEXT,
          "modelo" TEXT NOT NULL,
          "placa" TEXT NOT NULL UNIQUE,
          "pesoBrutoVehicular" REAL NOT NULL,
          "color" TEXT,
          "vin" TEXT,
          "ejesTraseros" INTEGER,
          "configuracionVehicular" TEXT,
          "subtipoRemolque" TEXT,
          "aseguradora" TEXT,
          "numeroPoliza" TEXT,
          "vigenciaPoliza" DATETIME,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL
        );
      `);

            // Create Dolly table
            await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Dolly" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "customId" TEXT NOT NULL UNIQUE,
          "marca" TEXT NOT NULL,
          "subMarca" TEXT,
          "modelo" TEXT NOT NULL,
          "pesoBrutoVehicular" REAL NOT NULL,
          "color" TEXT,
          "vin" TEXT,
          "ejes" INTEGER,
          "configuracionVehicular" TEXT,
          "subtipoRemolque" TEXT,
          "aseguradora" TEXT,
          "numeroPoliza" TEXT,
          "vigenciaPoliza" DATETIME,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL
        );
      `);

            // Create Operador table
            await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Operador" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "nombre" TEXT NOT NULL,
          "rfc" TEXT NOT NULL UNIQUE,
          "licencia" TEXT NOT NULL UNIQUE,
          "telefono" TEXT,
          "email" TEXT,
          "activo" BOOLEAN NOT NULL DEFAULT 1,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL
        );
      `);

            console.log('✅ Tables created successfully!');
        } else {
            console.log('Tables already exist');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
