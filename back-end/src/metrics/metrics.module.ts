// src/metrics/metrics.module.ts
import { Module, Global } from '@nestjs/common';
import {
  PrometheusModule,
  makeHistogramProvider,
  makeCounterProvider,
  makeGaugeProvider,
} from '@willsoto/nestjs-prometheus';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsInterceptor } from './metrics.interceptor';
import { ProductMetricsService } from './product-metrics.service';
import { PrismaMetricsService } from './prisma-metrics.service';

// Histograma para duración de peticiones HTTP
const httpRequestDurationHistogram = makeHistogramProvider({
  name: 'typing_http_request_duration_seconds',
  help: 'Duración de las peticiones HTTP en segundos',
  labelNames: ['handler', 'method', 'status_code'],
});

const httpRequestsInFlightGauge = makeGaugeProvider({
  name: 'typing_http_requests_in_flight',
  help: 'Solicitudes HTTP de la API que permanecen en ejecución',
  labelNames: ['handler'],
});

const frontendVitalHistogram = makeHistogramProvider({
  name: 'typing_frontend_web_vital_seconds',
  help: 'Web Vitals agregados recibidos desde navegadores',
  labelNames: ['metric_name', 'route', 'frontend_version'],
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2.5, 4, 8, 15],
});

const frontendClsHistogram = makeHistogramProvider({
  name: 'typing_frontend_cls',
  help: 'Cumulative Layout Shift agregado recibido desde navegadores',
  labelNames: ['route', 'frontend_version'],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
});

const frontendNavigationHistogram = makeHistogramProvider({
  name: 'typing_frontend_navigation_duration_seconds',
  help: 'Duración de navegación agregada recibida desde navegadores',
  labelNames: ['route', 'frontend_version'],
  buckets: [0.1, 0.25, 0.5, 1, 2, 4, 8, 15],
});

const frontendErrorsCounter = makeCounterProvider({
  name: 'typing_frontend_errors_total',
  help: 'Errores JavaScript y promesas rechazadas por categoría controlada',
  labelNames: ['error_category', 'route', 'frontend_version'],
});

const frontendRequestsFailedCounter = makeCounterProvider({
  name: 'typing_frontend_requests_failed_total',
  help: 'Solicitudes del navegador fallidas por ruta y clase de estado',
  labelNames: ['route', 'status_class', 'frontend_version'],
});

const frontendRequestDurationHistogram = makeHistogramProvider({
  name: 'typing_frontend_request_duration_seconds',
  help: 'Duración de solicitudes del navegador por ruta normalizada',
  labelNames: ['route', 'status_class', 'frontend_version'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 4, 8, 15],
});

const frontendSessionsCounter = makeCounterProvider({
  name: 'typing_frontend_sessions_observed_total',
  help: 'Sesiones de frontend observadas mediante muestreo',
  labelNames: ['frontend_version'],
});

// Compatibilidad: emitir ambas hasta completar la retención configurada de Prometheus (7 días en producción),
// y retirar typing_frontend_sessions_observed_total en el siguiente despliegue posterior a ese periodo.
const frontendInitializationsCounter = makeCounterProvider({
  name: 'typing_frontend_initializations_sampled_total',
  help: 'Inicializaciones muestreadas del frontend; no representa usuarios ni sesiones únicas',
  labelNames: ['frontend_version'],
});
const frontendPageViewsCounter = makeCounterProvider({
  name: 'typing_frontend_page_views_observed_total',
  help: 'Vistas de página observadas con consentimiento; no representa visitantes únicos',
  labelNames: ['route'],
});
const anonymousSessionsCounter = makeCounterProvider({
  name: 'typing_anonymous_sessions_observed_total',
  help: 'Sesiones anónimas observadas con consentimiento; no representa visitantes únicos',
});

const frontendSessionsByLocaleCounter = makeCounterProvider({
  name: 'typing_frontend_sessions_by_locale_total',
  help: 'Sesiones frontend observadas por locale canónico de la ruta',
  labelNames: ['locale', 'frontend_version'],
});

const prismaQueryDurationHistogram = makeHistogramProvider({
  name: 'typing_prisma_query_duration_seconds',
  help: 'Duración de operaciones Prisma por modelo y operación controlados',
  labelNames: ['model', 'operation'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

const prismaQueriesCounter = makeCounterProvider({
  name: 'typing_prisma_queries_total',
  help: 'Operaciones Prisma por modelo y operación controlados',
  labelNames: ['model', 'operation'],
});

const prismaErrorsCounter = makeCounterProvider({
  name: 'typing_prisma_query_errors_total',
  help: 'Errores de operaciones Prisma por modelo y operación controlados',
  labelNames: ['model', 'operation'],
});

// Contadores de negocio
const practiceSessionsCounter = makeCounterProvider({
  name: 'typing_practice_sessions_completed_total',
  help: 'Total de sesiones de práctica libre completadas',
  labelNames: ['authenticated', 'language', 'layout'],
});

const practiceResultsPersistedCounter = makeCounterProvider({
  name: 'typing_practice_results_persisted_total',
  help: 'Resultados de práctica creados y confirmados por PostgreSQL',
  labelNames: ['source'],
});
const practiceResultDuplicatesCounter = makeCounterProvider({
  name: 'typing_practice_result_duplicates_total',
  help: 'Reintentos idempotentes de resultados de práctica ya persistidos',
  labelNames: ['source'],
});
const practiceResultRejectedCounter = makeCounterProvider({
  name: 'typing_practice_result_rejected_total',
  help: 'Resultados de práctica rechazados por validación',
  labelNames: ['source', 'reason'],
});
const practiceResultErrorsCounter = makeCounterProvider({
  name: 'typing_practice_result_errors_total',
  help: 'Errores inesperados al guardar resultados de práctica',
  labelNames: ['source', 'operation'],
});
const practiceStartedObservedCounter = makeCounterProvider({
  name: 'typing_practice_started_observed_total',
  help: 'Prácticas iniciadas observadas en el navegador; no confirmadas por el backend',
  labelNames: ['auth_state', 'language', 'layout'],
});
const practiceCompletedObservedCounter = makeCounterProvider({
  name: 'typing_practice_completed_observed_total',
  help: 'Prácticas completadas observadas en el navegador; no confirmadas por el backend',
  labelNames: ['auth_state', 'language', 'layout'],
});
const practiceAbandonedObservedCounter = makeCounterProvider({
  name: 'typing_practice_abandoned_observed_total',
  help: 'Prácticas abandonadas observadas explícitamente en el navegador',
  labelNames: ['auth_state', 'language', 'layout'],
});

const practiceDurationHistogram = makeHistogramProvider({
  name: 'typing_practice_duration_seconds',
  help: 'Duración de sesiones de práctica libre en segundos',
  labelNames: ['language', 'layout'],
  buckets: [30, 60, 120, 300, 600, 1200, 1800, 3600],
});

const practiceNetWpmHistogram = makeHistogramProvider({
  name: 'typing_practice_net_wpm',
  help: 'Distribución agregada de WPM neto en práctica libre',
  labelNames: ['language', 'layout'],
  buckets: [10, 20, 30, 40, 50, 60, 70, 80, 100, 120, 150, 200, 250],
});

const practiceAccuracyHistogram = makeHistogramProvider({
  name: 'typing_practice_accuracy_percent',
  help: 'Distribución agregada de precisión en práctica libre',
  labelNames: ['language', 'layout'],
  buckets: [50, 60, 70, 80, 85, 90, 95, 98, 99, 100],
});

const lessonsCompletedCounter = makeCounterProvider({
  name: 'typing_lessons_completed_total',
  help: 'Total de lecciones completadas',
});

const registrationsCounter = makeCounterProvider({
  name: 'typing_registrations_total',
  help: 'Total de registros de usuario',
});

const loginsCounter = makeCounterProvider({
  name: 'typing_logins_total',
  help: 'Total de inicios de sesión',
});

const loginFailuresCounter = makeCounterProvider({
  name: 'typing_login_failures_total',
  help: 'Total de intentos fallidos de inicio de sesión',
  labelNames: ['reason'],
});

const passwordResetRequestsCounter = makeCounterProvider({
  name: 'typing_password_reset_requests_total',
  help: 'Solicitudes de recuperación de contraseña',
  labelNames: ['outcome'],
});

const passwordResetCompletedCounter = makeCounterProvider({
  name: 'typing_password_reset_completed_total',
  help: 'Intentos de completar recuperación de contraseña',
  labelNames: ['outcome'],
});

const passwordResetEmailFailedCounter = makeCounterProvider({
  name: 'typing_password_reset_email_failed_total',
  help: 'Fallos al enviar correos de recuperación de contraseña',
});

const authEventsCounter = makeCounterProvider({
  name: 'typing_auth_events_total',
  help: 'Eventos agregados de autenticación sin datos personales',
  labelNames: ['event', 'provider', 'outcome', 'reason'],
});

const productActiveUsersGauge = makeGaugeProvider({
  name: 'typing_product_active_users',
  help: 'Usuarios activos únicos según login, práctica o intento de lección',
  labelNames: ['window'],
});

const productNewUsersGauge = makeGaugeProvider({
  name: 'typing_product_new_users',
  help: 'Usuarios creados durante la ventana indicada',
  labelNames: ['window'],
});

const productRecurringUsersGauge = makeGaugeProvider({
  name: 'typing_product_recurring_users',
  help: 'Usuarios activos creados antes de la ventana indicada',
  labelNames: ['window'],
});

const productMetricsRefreshGauge = makeGaugeProvider({
  name: 'typing_product_metrics_last_refresh_timestamp_seconds',
  help: 'Marca de tiempo de la última actualización correcta de métricas de producto',
});
const productMetricsUpdateCounter = makeCounterProvider({
  name: 'typing_product_metrics_update_total',
  help: 'Actualizaciones de métricas de producto por operación y resultado',
  labelNames: ['result', 'operation'],
});
const productMetricsLastSuccessGauge = makeGaugeProvider({
  name: 'typing_product_metrics_last_success_timestamp_seconds',
  help: 'Fecha de la última actualización exitosa por operación de producto',
  labelNames: ['operation'],
});
const productMetricsUpdateDuration = makeHistogramProvider({
  name: 'typing_product_metrics_update_duration_seconds',
  help: 'Duración de cada actualización de métricas de producto',
  labelNames: ['operation'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30],
});

const productRetentionGauge = makeGaugeProvider({
  name: 'typing_product_retention_percent',
  help: 'Porcentaje de usuarios que tuvieron actividad el día D1, D7 o D30 tras registrarse',
  labelNames: ['window'],
});

const productRetentionCohortGauge = makeGaugeProvider({
  name: 'typing_product_retention_cohort_size',
  help: 'Tamaño de la última cohorte con edad suficiente para D1, D7 o D30',
  labelNames: ['window'],
});

const productCountryGauge = makeGaugeProvider({
  name: 'typing_product_country_events',
  help: 'Usuarios y eventos agregados por país declarado; unknown no tiene país registrado',
  labelNames: ['scope', 'country_code'],
});

const productLearningWpmGauge = makeGaugeProvider({
  name: 'typing_product_learning_wpm',
  help: 'Mediana agregada de WPM inicial, reciente y su diferencia entre prácticas',
  labelNames: ['segment_type', 'segment', 'stat'],
});

const productLearningAccuracyGauge = makeGaugeProvider({
  name: 'typing_product_learning_accuracy_percent',
  help: 'Mediana agregada de precisión inicial, reciente y su diferencia entre prácticas',
  labelNames: ['segment_type', 'segment', 'stat'],
});

const productLearningOutcomeGauge = makeGaugeProvider({
  name: 'typing_product_learning_wpm_outcome_percent',
  help: 'Porcentaje de usuarios que mejoran, se mantienen o empeoran en WPM',
  labelNames: ['segment_type', 'segment', 'outcome'],
});

const productLearningAccuracyOutcomeGauge = makeGaugeProvider({
  name: 'typing_product_learning_accuracy_outcome_percent',
  help: 'Porcentaje de usuarios que mejoran, se mantienen o empeoran en precisión',
  labelNames: ['segment_type', 'segment', 'outcome'],
});

const productLearningSampleGauge = makeGaugeProvider({
  name: 'typing_product_learning_sample_size',
  help: 'Usuarios con al menos dos prácticas incluidos en la comparación agregada',
  labelNames: ['segment_type', 'segment'],
});

@Global()
@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
    }),
  ],
  providers: [
    httpRequestDurationHistogram,
    httpRequestsInFlightGauge,
    frontendVitalHistogram,
    frontendClsHistogram,
    frontendNavigationHistogram,
    frontendErrorsCounter,
    frontendRequestsFailedCounter,
    frontendRequestDurationHistogram,
    frontendSessionsCounter,
    frontendSessionsByLocaleCounter,
    frontendInitializationsCounter,
    frontendPageViewsCounter,
    anonymousSessionsCounter,
    prismaQueryDurationHistogram,
    prismaQueriesCounter,
    prismaErrorsCounter,
    MetricsInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    practiceSessionsCounter,
    practiceResultsPersistedCounter,
    practiceResultDuplicatesCounter,
    practiceResultRejectedCounter,
    practiceResultErrorsCounter,
    practiceStartedObservedCounter,
    practiceCompletedObservedCounter,
    practiceAbandonedObservedCounter,
    practiceDurationHistogram,
    practiceNetWpmHistogram,
    practiceAccuracyHistogram,
    lessonsCompletedCounter,
    registrationsCounter,
    loginsCounter,
    loginFailuresCounter,
    passwordResetRequestsCounter,
    passwordResetCompletedCounter,
    passwordResetEmailFailedCounter,
    authEventsCounter,
    productActiveUsersGauge,
    productNewUsersGauge,
    productRecurringUsersGauge,
    productMetricsRefreshGauge,
    productMetricsUpdateCounter,
    productMetricsLastSuccessGauge,
    productMetricsUpdateDuration,
    productRetentionGauge,
    productRetentionCohortGauge,
    productCountryGauge,
    productLearningWpmGauge,
    productLearningAccuracyGauge,
    productLearningOutcomeGauge,
    productLearningAccuracyOutcomeGauge,
    productLearningSampleGauge,
    ProductMetricsService,
    PrismaMetricsService,
  ],
  exports: [
    httpRequestDurationHistogram,
    httpRequestsInFlightGauge,
    frontendVitalHistogram,
    frontendClsHistogram,
    frontendNavigationHistogram,
    frontendErrorsCounter,
    frontendRequestsFailedCounter,
    frontendRequestDurationHistogram,
    frontendSessionsCounter,
    frontendSessionsByLocaleCounter,
    frontendInitializationsCounter,
    frontendPageViewsCounter,
    anonymousSessionsCounter,
    prismaQueryDurationHistogram,
    prismaQueriesCounter,
    prismaErrorsCounter,
    practiceSessionsCounter,
    practiceResultsPersistedCounter,
    practiceResultDuplicatesCounter,
    practiceResultRejectedCounter,
    practiceResultErrorsCounter,
    practiceStartedObservedCounter,
    practiceCompletedObservedCounter,
    practiceAbandonedObservedCounter,
    practiceDurationHistogram,
    practiceNetWpmHistogram,
    practiceAccuracyHistogram,
    lessonsCompletedCounter,
    registrationsCounter,
    loginsCounter,
    loginFailuresCounter,
    passwordResetRequestsCounter,
    passwordResetCompletedCounter,
    passwordResetEmailFailedCounter,
    authEventsCounter,
    productActiveUsersGauge,
    productNewUsersGauge,
    productRecurringUsersGauge,
    productMetricsRefreshGauge,
    productMetricsUpdateCounter,
    productMetricsLastSuccessGauge,
    productMetricsUpdateDuration,
    productRetentionGauge,
    productRetentionCohortGauge,
    productCountryGauge,
    productLearningWpmGauge,
    productLearningAccuracyGauge,
    productLearningOutcomeGauge,
    productLearningAccuracyOutcomeGauge,
    productLearningSampleGauge,
  ],
})
export class MetricsModule {}
