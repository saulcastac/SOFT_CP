import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const regimenesFiscales = [
    { clave: "601", descripcion: "General de Ley Personas Morales" },
    { clave: "603", descripcion: "Personas Morales con Fines no Lucrativos" },
    { clave: "605", descripcion: "Sueldos y Salarios e Ingresos Asimilados a Salarios" },
    { clave: "606", descripcion: "Arrendamiento" },
    { clave: "607", descripcion: "Régimen de Enajenación o Adquisición de Bienes" },
    { clave: "608", descripcion: "Demás ingresos" },
    { clave: "610", descripcion: "Residentes en el Extranjero sin Establecimiento Permanente en México" },
    { clave: "611", descripcion: "Ingresos por Dividendos (socios y accionistas)" },
    { clave: "612", descripcion: "Personas Físicas con Actividades Empresariales y Profesionales" },
    { clave: "614", descripcion: "Ingresos por intereses" },
    { clave: "615", descripcion: "Régimen de los ingresos por obtención de premios" },
    { clave: "616", descripcion: "Sin obligaciones fiscales" },
    { clave: "620", descripcion: "Sociedades Cooperativas de Producción que optan por diferir sus ingresos" },
    { clave: "621", descripcion: "Incorporación Fiscal" },
    { clave: "622", descripcion: "Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras" },
    { clave: "623", descripcion: "Opcional para Grupos de Sociedades" },
    { clave: "624", descripcion: "Coordinados" },
    { clave: "625", descripcion: "Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas" },
    { clave: "626", descripcion: "Régimen Simplificado de Confianza" },
];

const subtiposRemolque = [
    { clave: "CTR001", descripcion: "Caballete" },
    { clave: "CTR002", descripcion: "Caja" },
    { clave: "CTR003", descripcion: "Caja Abierta" },
    { clave: "CTR004", descripcion: "Caja Cerrada" },
    { clave: "CTR005", descripcion: "Caja De Recolección Con Cargador Frontal" },
    { clave: "CTR006", descripcion: "Caja Refrigerada" },
    { clave: "CTR007", descripcion: "Caja Seca" },
    { clave: "CTR008", descripcion: "Caja Transferencia" },
    { clave: "CTR009", descripcion: "Cama Baja o Cuello Ganso" },
    { clave: "CTR010", descripcion: "Chasis Portacontenedor" },
    { clave: "CTR011", descripcion: "Convencional De Chasis" },
    { clave: "CTR012", descripcion: "Equipo Especial" },
    { clave: "CTR013", descripcion: "Estacas" },
    { clave: "CTR014", descripcion: "Góndola Madrina" },
    { clave: "CTR015", descripcion: "Grúa Industrial" },
    { clave: "CTR016", descripcion: "Grúa" },
    { clave: "CTR017", descripcion: "Integral" },
    { clave: "CTR018", descripcion: "Jaula" },
    { clave: "CTR019", descripcion: "Media Redila" },
    { clave: "CTR020", descripcion: "Pallet o Celdillas" },
    { clave: "CTR021", descripcion: "Plataforma" },
    { clave: "CTR022", descripcion: "Plataforma Con Grúa" },
    { clave: "CTR023", descripcion: "Plataforma Encortinada" },
    { clave: "CTR024", descripcion: "Redilas" },
    { clave: "CTR025", descripcion: "Refrigerador" },
    { clave: "CTR026", descripcion: "Revolvedora" },
    { clave: "CTR027", descripcion: "Semicaja" },
    { clave: "CTR028", descripcion: "Tanque" },
    { clave: "CTR029", descripcion: "Tolva" },
    { clave: "CTR031", descripcion: "Volteo" },
    { clave: "CTR032", descripcion: "Volteo Desmontable" },
];

async function main() {
    console.log('🌱 Seeding regímenes fiscales...');

    for (const regimen of regimenesFiscales) {
        await prisma.regimenFiscal.upsert({
            where: { clave: regimen.clave },
            update: { descripcion: regimen.descripcion },
            create: regimen,
        });
    }

    console.log('✅ Regímenes fiscales seeded successfully!');

    console.log('🌱 Seeding subtipos de remolque...');

    for (const subtipo of subtiposRemolque) {
        await prisma.subtipoRemolque.upsert({
            where: { clave: subtipo.clave },
            update: { descripcion: subtipo.descripcion },
            create: subtipo,
        });
    }

    console.log('✅ Subtipos de remolque seeded successfully!');
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
