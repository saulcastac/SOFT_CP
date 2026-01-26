-- Seed regímenes fiscales para Turso
-- Usa REPLACE para que sea idempotente (puede ejecutarse múltiples veces)

REPLACE INTO RegimenFiscal (id, clave, descripcion, activo, createdAt, updatedAt)
VALUES
  ('rf-601', '601', 'General de Ley Personas Morales', 1, datetime('now'), datetime('now')),
  ('rf-603', '603', 'Personas Morales con Fines no Lucrativos', 1, datetime('now'), datetime('now')),
  ('rf-605', '605', 'Sueldos y Salarios e Ingresos Asimilados a Salarios', 1, datetime('now'), datetime('now')),
  ('rf-606', '606', 'Arrendamiento', 1, datetime('now'), datetime('now')),
  ('rf-607', '607', 'Régimen de Enajenación o Adquisición de Bienes', 1, datetime('now'), datetime('now')),
  ('rf-608', '608', 'Demás ingresos', 1, datetime('now'), datetime('now')),
  ('rf-610', '610', 'Residentes en el Extranjero sin Establecimiento Permanente en México', 1, datetime('now'), datetime('now')),
  ('rf-611', '611', 'Ingresos por Dividendos (socios y accionistas)', 1, datetime('now'), datetime('now')),
  ('rf-612', '612', 'Personas Físicas con Actividades Empresariales y Profesionales', 1, datetime('now'), datetime('now')),
  ('rf-614', '614', 'Ingresos por intereses', 1, datetime('now'), datetime('now')),
  ('rf-615', '615', 'Régimen de los ingresos por obtención de premios', 1, datetime('now'), datetime('now')),
  ('rf-616', '616', 'Sin obligaciones fiscales', 1, datetime('now'), datetime('now')),
  ('rf-620', '620', 'Sociedades Cooperativas de Producción que optan por diferir sus ingresos', 1, datetime('now'), datetime('now')),
  ('rf-621', '621', 'Incorporación Fiscal', 1, datetime('now'), datetime('now')),
  ('rf-622', '622', 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras', 1, datetime('now'), datetime('now')),
  ('rf-623', '623', 'Opcional para Grupos de Sociedades', 1, datetime('now'), datetime('now')),
  ('rf-624', '624', 'Coordinados', 1, datetime('now'), datetime('now')),
  ('rf-625', '625', 'Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas', 1, datetime('now'), datetime('now')),
  ('rf-626', '626', 'Régimen Simplificado de Confianza', 1, datetime('now'), datetime('now'));
