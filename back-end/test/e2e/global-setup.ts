// test/e2e/global-setup.ts
// Este archivo se ejecuta una vez antes de todos los tests e2e.
// En el futuro se encargará de preparar la base de datos de prueba:
// - Cargar variables de entorno desde .env.test
// - Ejecutar migraciones o "prisma db push" para sincronizar el esquema
// - Opcionalmente, insertar datos de referencia (usuarios, lecciones, etc.)
export default async function globalSetup() {
  // Placeholder: actualmente no realiza ninguna acción.
}
