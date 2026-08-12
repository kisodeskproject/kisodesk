# Sistema de progreso

> Última modificación/revisión: 2026-08-11

## Resumen

Sistema que calcula y expone las métricas de progreso del usuario (WPM promedio, precisión promedio, racha de días consecutivos, tiempo total practicado, evolución semanal/mensual) a partir de las sesiones de práctica y lecciones completadas. Alimenta el dashboard principal (`app/[lang]/dashboard/page.tsx`).

Funciona en **dos modos**, ya que la app no requiere login obligatorio:
- **Usuario logueado**: los datos se calculan en el backend a partir de la base de datos.
- **Invitado**: los mismos datos se calculan en el cliente a partir de lo guardado en `localStorage`, sin llamar al backend.

No cubre en detalle (son sistemas relacionados pero separados, con su propio backend/frontend):
- **Ranking** (`back-end/src/ranking/`, `/ranking`, `/ranking/user-stats`) — ver el propio `userRankingCache`, calculado desde `PracticeSession` pero independiente de este sistema.
- **Seguimiento de errores por tecla** (`back-end/src/errors/`, hook `useWeakKeys`, componentes `ErrorTrends`/`FingerDistribution`) — usa sus propios endpoints, no `/progress`.

---

## 1. Backend

### Endpoints (`back-end/src/progress/progress.controller.ts`)

Ambos protegidos con `JwtAuthGuard` (requieren usuario logueado — para invitados, ver §3).

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/progress?locale=` | Estadísticas agregadas + `userStats` (ver modelo abajo). |
| GET | `/progress/calendar?locale=` | Minutos practicados por día, para el calendario de actividad. |

### Lógica (`back-end/src/progress/progress.service.ts`)

`getProgress(userId, locale)`:
1. Cuenta lecciones totales (`lesson.count()`) y progreso del usuario (`userLessonProgress`, filtrado por `localeCode`) para `completedLessons` (status `COMPLETED`/`MASTERED`) y `completedCourses` (cursos donde todas sus lecciones están completadas).
2. Suma `practiceDay.totalSeconds` para `totalPracticeTime`.
3. Toma las **últimas 10** `practiceSession` (`take: 10`, orden por `createdAt desc`) para calcular `averageWpm`/`averageAccuracy` — **no** es un promedio histórico completo, es sobre las 10 sesiones más recientes.
4. `bestWpm`/`bestAccuracy` salen del máximo entre `userLessonProgress.bestQualifiedNetWpm`/`bestAccuracy` (solo lecciones de tipo `practice`).
5. Junta lecciones completadas + **todas** las `practiceSession` del usuario en una lista de `{date, wpm, accuracy}` ordenada cronológicamente, y a partir de ahí arma:
   - `weeklyProgress`/`weeklyAccuracy`: promedio por día, últimos 7 días (`getRecentDailySeries`, rellena con 0 los días sin actividad).
   - `monthlyProgress`: igual pero últimos 30 días.
   - `streak` (racha actual de días consecutivos con actividad, calculada sobre fechas únicas de esa misma lista combinada).
6. `totalKeystrokes` en `userStats` está **hardcodeado a `null`** (línea 156 de `progress.service.ts`) — no se calcula actualmente.

`getCalendar(userId, locale)`: lee `practiceDay` (filtrado por `userId`+`localeCode`), devuelve `{date, minutes}` por día (convierte `totalSeconds` a minutos con `Math.ceil`).

`recordPracticeTimeInTransaction(tx, userId, seconds, occurredAt, localeCode)`: función auxiliar (usada por otros módulos, no expuesta por HTTP directamente) que hace `upsert` sobre `practiceDay`, sumando segundos al día correspondiente (clave compuesta `userId+date+localeCode`).

### Persistencia (Prisma, `back-end/prisma/schema.prisma`)

No hay tablas dedicadas a "estadísticas agregadas" — todo se calcula al vuelo, en cada request, a partir de tablas transaccionales ya usadas por otros sistemas:

| Modelo | Uso en este sistema |
|---|---|
| `PracticeSession` (línea ~368) | Sesiones de práctica libre individuales (`netWpm`, `grossWpm`, `accuracy`, `createdAt`, `localeCode`). Fuente de `averageWpm`/`averageAccuracy` (últimas 10) y de las series semanales/mensuales/racha (todas). |
| `PracticeDay` (línea ~279) | Un registro por `userId`+`date`+`localeCode`, con `totalSeconds` acumulado ese día. Clave primaria compuesta. Fuente de `totalPracticeTime` y del calendario. |
| `UserLessonProgress` (línea ~224) | Progreso por lección (`status`, `bestQualifiedNetWpm`, `bestAccuracy`, `achievedAt`, `attemptsCount`). Fuente de `completedLessons`/`completedCourses`/`bestWpm`/`bestAccuracy` y de los puntos de lección en las series de progreso. |

No hay `lesson_session_stats`, `user_statistics` ni `performance_trends` — esas tablas no existen en el schema actual.

---

## 2. Frontend — usuario logueado

### Hooks (`front-end/hooks/useProgress.ts`)

| Hook | Qué hace |
|---|---|
| `useProgress(locale)` | Llama `GET /progress`, expone `stats: ProgressStats`, `userStats: UserStats`, `loading`, `error`, `fetchProgress()`. |
| `useNormalizedProgress(locale)` | Envuelve `useProgress` + `normalizeProgress()` (ver abajo), expone `normalized: ProgressData \| null`. Es el que consume el dashboard directamente. |
| `usePracticeCalendar(locale)` | Llama `GET /progress/calendar`, expone `days: PracticeDay[]`. |

### Normalización (`front-end/lib/normalizeProgress.ts`)

`normalizeProgress(stats, userStats)` combina la respuesta cruda del backend en un solo objeto `ProgressData` para la UI: agrega `formattedPracticeTime` (ej. "2h 15m"), y calcula `wpmTrend`/`accuracyTrend` (variación % entre el último y el penúltimo punto de `weeklyProgress`/`weeklyAccuracy` — **no** es una tendencia estadística real, es solo la diferencia entre los últimos dos días con datos).

### Tipos (`front-end/types/progress.ts`)

```ts
ChartData        { labels: string[], values: number[] }
ProgressTrend     { value: number, isPositive: boolean }
ProgressStats     // respuesta cruda de GET /progress → stats
  { totalLessons, completedLessons, completedCourses?, averageWpm, averageAccuracy,
    totalPracticeTime, weeklyProgress: ChartData, weeklyAccuracy: ChartData, monthlyProgress: ChartData }
UserStats         // respuesta cruda de GET /progress → userStats
  { bestWpm, bestAccuracy, totalKeystrokes, streak }
ProgressData      // normalizado, lo que consume la UI
  { completedLessons, completedCourses?, averageWpm, averageAccuracy, streak,
    totalPracticeTime, formattedPracticeTime, weeklyProgress, monthlyProgress, wpmTrend?, accuracyTrend? }
PracticeDay       { date, minutes }
```

---

## 3. Frontend — usuario invitado (sin login)

La app no requiere login para practicar, así que el dashboard también debe funcionar sin backend. `app/[lang]/dashboard/page.tsx` decide la fuente de datos según `isAuthenticated` (hook `useAuth`):

- **Logueado** → `useNormalizedProgress` + `usePracticeCalendar` (arriba).
- **Invitado** → lee `localStorage` directamente vía `lib/guestProgressStore.ts` (`readGuestProgress()`) y lo transforma con funciones de `lib/guestDashboardProgress.ts`:
  - `getGuestProgressForLanguage(progress, locale)` — filtra por idioma.
  - `getGuestDashboardProgress(progress, now?)` — arma un `ProgressData` equivalente al normalizado del backend (mismo shape), calculando `averageWpm`/`averageAccuracy`/`streak`/`weeklyProgress`/`monthlyProgress` a partir de `progress.lessons` + `progress.practice` guardados localmente.
  - `getGuestPracticeDays(progress)` — equivalente local a `/progress/calendar`.

Ambos caminos (logueado/invitado) terminan en el **mismo shape** (`ProgressData`/`PracticeDay[]`), así que los componentes de UI no necesitan saber cuál está activo.

**Sincronización al loguearse**: cuando un invitado inicia sesión, `AuthContext.tsx` dispara `syncGuestPracticeResults()`/`syncGuestLessonAttempts()` (en `guestProgressStore.ts`) para subir lo guardado localmente al backend vía `POST /practice/results` y `POST /lessons/:id/complete` — después de eso, el progreso pasa a calcularse desde el backend con normalidad.

---

## 4. Componentes del dashboard (`front-end/components/dashboard/`)

| Componente | Qué muestra | Fuente de datos |
|---|---|---|
| `StatsGrid` | WPM promedio, precisión, racha, tiempo total (4 tarjetas). | `ProgressData` (normalizado o de invitado). |
| `ProgressChart` | Línea de progreso (usado dos veces: semanal y mensual). Canvas nativo, sin librería de gráficos. | `ChartData` (`weeklyProgress`/`monthlyProgress`). |
| `PracticeCalendar` | Mapa de calor de minutos practicados por día. | `PracticeDay[]`. |
| `ErrorTrends` / `FingerDistribution` | Errores por tecla / distribución por dedo. **No son parte de este sistema** — consumen `useWeakKeys` (`back-end/src/errors/`), un sistema aparte. | `WeakKey[]` (propio o de `guestDashboardProgress.getGuestWeakKeys`). |

`app/[lang]/dashboard/page.tsx` es quien orquesta todo: decide logueado/invitado, arma las props de cada componente, y calcula el `status` de `StatsGrid` (`'data' | 'empty' | 'guest'`).

---

## Archivos relevantes

| Archivo | Responsabilidad |
|---|---|
| `back-end/src/progress/progress.controller.ts` | Endpoints `GET /progress`, `GET /progress/calendar`. |
| `back-end/src/progress/progress.service.ts` | Cálculo de estadísticas agregadas, series temporales, racha. |
| `back-end/prisma/schema.prisma` | Modelos `PracticeSession`, `PracticeDay`, `UserLessonProgress` (persistencia real usada, sin tablas agregadas dedicadas). |
| `front-end/hooks/useProgress.ts` | `useProgress`, `useNormalizedProgress`, `usePracticeCalendar`. |
| `front-end/lib/normalizeProgress.ts` | Normaliza la respuesta cruda del backend a `ProgressData`. |
| `front-end/types/progress.ts` | Tipos `ProgressStats`, `UserStats`, `ProgressData`, `ChartData`, `PracticeDay`. |
| `front-end/lib/guestProgressStore.ts` | Lectura/escritura de progreso de invitado en `localStorage`, sincronización al loguearse. |
| `front-end/lib/guestDashboardProgress.ts` | Transforma el progreso de invitado al mismo shape que usa el backend. |
| `front-end/app/[lang]/dashboard/page.tsx` | Orquesta logueado vs. invitado, arma props para los componentes. |
| `front-end/components/dashboard/StatsGrid.tsx`, `ProgressChart.tsx`, `PracticeCalendar.tsx` | Componentes de UI del dashboard. |
