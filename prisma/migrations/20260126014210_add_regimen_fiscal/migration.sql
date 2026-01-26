-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "storagePath" TEXT,
    "fileType" TEXT,
    "extractedJson" TEXT,
    "facturamaId" TEXT,
    "uuid" TEXT
);

-- CreateTable
CREATE TABLE "Tractocamion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customId" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "subMarca" TEXT,
    "modelo" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
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
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'user_default'
);

-- CreateTable
CREATE TABLE "Plataforma" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customId" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "subMarca" TEXT,
    "modelo" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
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
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'user_default'
);

-- CreateTable
CREATE TABLE "Dolly" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customId" TEXT NOT NULL,
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
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'user_default'
);

-- CreateTable
CREATE TABLE "Operador" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidoPaterno" TEXT NOT NULL,
    "apellidoMaterno" TEXT,
    "rfc" TEXT,
    "licencia" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'user_default'
);

-- CreateTable
CREATE TABLE "Emisor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rfc" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "regimenFiscal" TEXT NOT NULL,
    "codigoPostal" TEXT NOT NULL,
    "calle" TEXT,
    "numeroExterior" TEXT,
    "numeroInterior" TEXT,
    "colonia" TEXT,
    "municipio" TEXT,
    "estado" TEXT,
    "pais" TEXT NOT NULL DEFAULT 'MEX',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'user_default'
);

-- CreateTable
CREATE TABLE "RegimenFiscal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clave" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Tractocamion_customId_key" ON "Tractocamion"("customId");

-- CreateIndex
CREATE UNIQUE INDEX "Tractocamion_placa_key" ON "Tractocamion"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "Plataforma_customId_key" ON "Plataforma"("customId");

-- CreateIndex
CREATE UNIQUE INDEX "Plataforma_placa_key" ON "Plataforma"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "Dolly_customId_key" ON "Dolly"("customId");

-- CreateIndex
CREATE UNIQUE INDEX "Operador_customId_key" ON "Operador"("customId");

-- CreateIndex
CREATE UNIQUE INDEX "Emisor_rfc_key" ON "Emisor"("rfc");

-- CreateIndex
CREATE UNIQUE INDEX "RegimenFiscal_clave_key" ON "RegimenFiscal"("clave");
