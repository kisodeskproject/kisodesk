// test/e2e/mock-metrics.module.ts
// Módulo de métricas falso para pruebas.
// En el futuro, aquí se proveerán mocks de todos los tokens de métricas inyectados
// por el MetricsModule real (contadores, histogramas, etc.) para evitar errores
// de dependencia en el entorno de testing.
import { Module } from '@nestjs/common';

@Module({
  providers: [],
  exports: [],
})
export class MockMetricsModule {}
