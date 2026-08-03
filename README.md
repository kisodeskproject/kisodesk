# KisoDesk

KisoDesk es una plataforma web de aprendizaje de mecanografía. Incluye cursos guiados, práctica libre, seguimiento de progreso, ranking y soporte para múltiples idiomas y distribuciones de teclado.

Demo: [kisodesk.online](https://kisodesk.online)

## Capturas

Las capturas de la interfaz se añadirán aquí.

## Tecnologías

- Frontend: Next.js, React, TypeScript y Tailwind CSS.
- Backend: NestJS, Prisma y PostgreSQL.
- Infraestructura local: Docker Compose, Redis y MinIO.

## Arquitectura

`front-end/` contiene la aplicación web, rutas, componentes e internacionalización. `back-end/` contiene la API, lógica de dominio, Prisma y servicios de métricas. Ambos proyectos se conectan mediante la API HTTP.

## Instalación local

1. Copia `front-end/.env.example` y `back-end/.env.example` como `.env` y completa las variables requeridas.
2. Instala dependencias en ambos proyectos:

   ```bash
   cd front-end && npm ci
   cd ../back-end && npm ci
   ```

3. Inicia el backend y sus servicios locales:

   ```bash
   cd back-end
   docker compose -f docker-compose.example.yml up -d postgres redis
   npm run start:dev
   ```

4. Inicia el frontend:

   ```bash
   cd front-end
   npm run dev
   ```

## Contribuir

Consulta [CONTRIBUTING.md](CONTRIBUTING.md). Reporta vulnerabilidades según [SECURITY.md](SECURITY.md).

## Estado

El proyecto está en desarrollo activo. Las rutas de aprendizaje, práctica, progreso, ranking, autenticación e internacionalización están implementadas; la configuración local requiere servicios y variables de entorno propios.

## Licencia

Distribuido bajo la licencia MIT. Consulta [LICENSE](LICENSE).
