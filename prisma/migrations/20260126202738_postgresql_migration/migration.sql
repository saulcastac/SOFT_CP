-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storagePath" TEXT,
    "fileType" TEXT,
    "extractedJson" TEXT,
    "facturamaId" TEXT,
    "uuid" TEXT,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tractocamion" (
    "id" TEXT NOT NULL,
    "customId" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "subMarca" TEXT,
    "modelo" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "kilometrajeInicial" DOUBLE PRECISION,
    "pesoBrutoVehicular" DOUBLE PRECISION NOT NULL,
    "color" TEXT,
    "vin" TEXT,
    "ejesTraseros" INTEGER,
    "configuracionVehicular" TEXT,
    "subtipoRemolque" TEXT,
    "aseguradora" TEXT,
    "numeroPoliza" TEXT,
    "vigenciaPoliza" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'user_default',

    CONSTRAINT "Tractocamion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plataforma" (
    "id" TEXT NOT NULL,
    "customId" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "subMarca" TEXT,
    "modelo" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "pesoBrutoVehicular" DOUBLE PRECISION NOT NULL,
    "color" TEXT,
    "vin" TEXT,
    "ejesTraseros" INTEGER,
    "configuracionVehicular" TEXT,
    "subtipoRemolque" TEXT,
    "aseguradora" TEXT,
    "numeroPoliza" TEXT,
    "vigenciaPoliza" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'user_default',

    CONSTRAINT "Plataforma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dolly" (
    "id" TEXT NOT NULL,
    "customId" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "subMarca" TEXT,
    "modelo" TEXT NOT NULL,
    "pesoBrutoVehicular" DOUBLE PRECISION NOT NULL,
    "color" TEXT,
    "vin" TEXT,
    "ejes" INTEGER,
    "configuracionVehicular" TEXT,
    "subtipoRemolque" TEXT,
    "aseguradora" TEXT,
    "numeroPoliza" TEXT,
    "vigenciaPoliza" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'user_default',

    CONSTRAINT "Dolly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operador" (
    "id" TEXT NOT NULL,
    "customId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidoPaterno" TEXT NOT NULL,
    "apellidoMaterno" TEXT,
    "rfc" TEXT,
    "licencia" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'user_default',

    CONSTRAINT "Operador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Emisor" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'user_default',

    CONSTRAINT "Emisor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegimenFiscal" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegimenFiscal_pkey" PRIMARY KEY ("id")
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
