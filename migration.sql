-- CreateTable for Tractocamion
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

-- CreateTable for Plataforma
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

-- CreateTable for Dolly
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

-- CreateTable for Operador
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
