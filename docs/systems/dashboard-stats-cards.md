# Cards de estadísticas del dashboard

> Última modificación/revisión: 2026-08-11

## Resumen

Documenta el componente visual de las 4 cards de estadísticas resumidas (WPM promedio, precisión promedio, racha, tiempo total de práctica) que aparecen arriba del todo en `app/[lang]/dashboard/page.tsx`. Para el origen de esos datos (backend vs. invitado, endpoints, modelos Prisma) ver **[[progress-system]]** — este documento no repite ese detalle, se enfoca en el componente en sí y sus estados visuales.

## Componente: `StatsGrid.tsx`

`front-end/components/dashboard/StatsGrid.tsx` es el componente real. Todo el markup de las 4 cards está **inline dentro de este único archivo** (no delega a un subcomponente por card).

Props:

```ts
interface StatsGridProps {
  status: 'guest' | 'error' | 'empty' | 'data';
  data?: ProgressData;
  translations: { completedLessons, completedCourses, averageWpm, averageAccuracy, streak,
                   totalPracticeTime, days, wordsPerMinute, accuracy, consecutivePractice,
                   thisWeek, signIn: string };
}
```

Cada una de las 4 cards sigue el mismo patrón: un círculo con ícono de `lucide-react` (`Zap` para WPM, `Target` para precisión, `Flame` para racha, `Clock` para tiempo total), un valor grande (`text-2xl font-bold`), un label, y una descripción opcional en texto pequeño. Los valores salen directo de `data` (el `ProgressData` normalizado, definido en `progress-system.md`):

| Card | Valor | Descripción (label secundario) |
|---|---|---|
| WPM | `data.averageWpm` | `translations.wordsPerMinute` |
| Precisión | `` `${data.averageAccuracy}%` `` | `translations.accuracy` |
| Racha | `` `${data.streak} ${translations.days}` `` | `translations.consecutivePractice` |
| Tiempo total | `data.formattedPracticeTime` | — (sin descripción) |

## Estados (`status`)

`status` lo decide `app/[lang]/dashboard/page.tsx`, no el propio `StatsGrid`:

| `status` | Cuándo se pasa | Origen |
|---|---|---|
| `'data'` | Usuario logueado con `normalized` disponible, **o** invitado con datos guardados en `localStorage` | `useNormalizedProgress` (logueado) / `getGuestDashboardProgress` (invitado, `lib/guestDashboardProgress.ts`) |
| `'empty'` | Usuario logueado pero sin `normalized` todavía (incluye el estado de carga: `DashboardSkeleton.tsx` renderiza `<StatsGrid status="empty" />` como esqueleto mientras `isLoading` es `true`) | `dashboard/page.tsx` |
| `'guest'` | Invitado (no logueado) sin datos locales de práctica | `dashboard/page.tsx` |
| `'error'` | Definido en el tipo `GridStatus`, pero **`dashboard/page.tsx` nunca lo pasa actualmente** — los errores de fetch se muestran aparte, con `ErrorBanner`, no vía `StatsGrid` | — |

**Hallazgo no obvio**: dentro de `StatsGrid.tsx`, la única distinción real en el render es `status === 'data'` vs. cualquier otro valor — los 4 valores muestran `'—'` si `status !== 'data'`, sin importar si es `'guest'`, `'empty'` o (hipotéticamente) `'error'`. No hay tratamiento visual distinto entre esos tres, y `translations.signIn` se recibe como prop pero **no se usa en ningún render actual del componente** (queda ahí, sin conectar a nada visible).

## Colores por tema

Cada card resuelve su color vía variables CSS, no vía props — el componente es agnóstico del tema activo:

```
--dashboard-stat-{wpm,accuracy,streak,time}-{icon,background,border}
```

Definidas en `front-end/app/globals.css`:
- `:root` (tema claro): colores sólidos y opacos, ícono blanco sobre círculo de color (ej. `--dashboard-stat-wpm-icon: #ffffff`, `--dashboard-stat-wpm-background: #c99a2e`).
- `.dark`: círculo con fondo `rgba(...)` semitransparente y el ícono en el propio tono de acento (ej. `--dashboard-stat-wpm-icon: #fbbf24`, `--dashboard-stat-wpm-background: rgba(251, 191, 36, 0.15)`).
- `.light .light-uses-dark-surfaces` (wrapper usado en varias páginas del dashboard/auth) **no redefine estas variables** — hereda los valores de `:root`.

## `StatsCard.tsx`: componente sin usar

`front-end/components/dashboard/StatsCard.tsx` es un componente genérico de card individual (título, valor, descripción, ícono, tendencia opcional), con la misma idea de props que una card de `StatsGrid`. **No está importado en ningún lugar de la app** (no hay ningún `import StatsCard from '@/components/dashboard/StatsCard'` fuera del propio archivo) — es código muerto. No confundirlo con las cards reales del dashboard, que viven inline en `StatsGrid.tsx`.

## Archivos relevantes

| Archivo | Responsabilidad |
|---|---|
| `front-end/components/dashboard/StatsGrid.tsx` | Componente real de las 4 cards de estadísticas — todo el markup vive acá. |
| `front-end/components/dashboard/StatsCard.tsx` | Componente de card individual genérico, **sin uso actual**. |
| `front-end/components/dashboard/DashboardSkeleton.tsx` | Usa `<StatsGrid status="empty" />` como esqueleto de carga. |
| `front-end/app/[lang]/dashboard/page.tsx` | Decide `status` y arma `data` (logueado vs. invitado), orquesta todo el dashboard. |
| `front-end/app/globals.css` | Variables `--dashboard-stat-*` por tema. |
| `front-end/types/progress.ts` | Tipo `ProgressData` que consume `data`. |
