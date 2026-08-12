# Sistema de teclado

> Última modificación/revisión: 2026-08-11

## Resumen

El sistema de teclado de la app (`front-end/`) está compuesto por **tres piezas independientes** que se combinan en tiempo de render, pero que no se sincronizan entre sí más allá de una inicialización única:

1. **Distribución lógica** (*logical layout*): qué carácter produce cada tecla física, según idioma/disposición (QWERTY español, QWERTZ alemán, Dvorak, etc).
2. **Familia física** (*physical family*): la forma real del teclado del usuario (ISO, ANSI, ABNT2, JIS, KS, BIG_ASS) — qué teclas existen y qué forma tienen (Enter, Shift, etc).
3. **Render SVG**: dibuja el teclado en pantalla combinando las dos anteriores.

---

## 1. Distribución lógica (`front-end/lib/keyboardLayouts.ts`)

`KEYBOARD_LAYOUTS` es un array con 23 distribuciones. Cada una implementa la interfaz `KeyboardLayout`:

```ts
interface KeyboardLayout {
  id: KeyboardLayoutId;
  name: string;
  description?: string;
  enabled: boolean;
  languageCodes: readonly Locale[];       // idiomas de interfaz donde aparece como opción
  physicalType?: KeyboardPhysicalFamily;  // valor de referencia, NO una atadura rígida
  keys: Record<PhysicalKeyId, string>;        // tecla base
  shiftedKeys?: Record<PhysicalKeyId, string>; // con Shift
  altGrKeys?: Record<PhysicalKeyId, string>;   // con AltGr
  shiftAltGrKeys?: Record<PhysicalKeyId, string>;
  deadKeys?: readonly DeadKeyDefinition[];     // teclas muertas (acentos compuestos)
}
```

Puntos clave:

- Los diccionarios `keys`/`shiftedKeys`/`altGrKeys` están indexados por **`PhysicalKeyId`** (`P01`–`P70` aprox., definidos en `lib/keyboardPhysical.ts`), un identificador de posición física **universal**, no específico de ninguna familia física ni de ningún idioma. Esto es lo que permite que una distribución lógica se use con cualquier familia física (ver §4).
- `languageCodes` es lo único que determina si una distribución aparece como opción para un idioma de interfaz dado (ver §3). Una misma distribución puede tener varios idiomas — hoy por ejemplo `qwerty-us-intl`, `dvorak` y `colemak` se reutilizan entre varios idiomas europeos como opciones alternativas genéricas (sin caracteres propios de un idioma en particular).
- `deadKeys`: cada entrada asocia una tecla física + estado de Shift a un acento compuesto (`makeDeadKey(physicalKeyId, shiftKey, mark)`). Ej.: en `qwerty-latam`, `P26` sin Shift es acento agudo, `P26` con Shift es diéresis — la misma tecla física sirve para dos acentos distintos según el estado de Shift.

### Funciones principales

| Función | Qué hace |
|---|---|
| `getEnabledLayouts()` | Todas las distribuciones con `enabled: true`. |
| `getEnabledLayoutsForLocale(locale, physicalFamily)` | Opciones para el dropdown de un idioma — ver §3, es la función clave del acoplamiento idioma↔distribución. |
| `layoutSupportsLocale(layout, locale)` | `true` si `locale` está en `layout.languageCodes`. |
| `getDefaultLayoutForLocale(locale)` / `getDefaultLayoutForLanguage(lang)` | Distribución por defecto para un locale/idioma (primera coincidencia). |
| `getKeyOutput(layout, physicalKeyId, shiftKey?, altGr?)` | Carácter que produce una tecla física dada la distribución. |
| `getDeadKey(layout, physicalKeyId, shiftKey)` | Busca si esa tecla física (+ Shift) es una tecla muerta en esa distribución. |
| `getKeyboardLayoutCompatibility(layout, physicalFamily)` | Calcula qué `PhysicalKeyId` de la distribución **no existen** en una familia física dada (`missingPhysicalKeyIds`) — solo se usa para ordenar, no para filtrar (ver §3). |

---

## 2. Familia física (`front-end/lib/keyboardPhysical.ts` + `contexts/KeyboardLayoutContext.tsx`)

Valores posibles: `ISO`, `ANSI`, `ABNT2`, `JIS`, `KS`, `BIG_ASS`. Determinan:
- Qué `PhysicalKeyId` existen (`PHYSICAL_KEY_ID_ROWS[family]`, ~línea 128-328 de `keyboardPhysical.ts`) — ej. ANSI no tiene `P43` ni `P28`; ISO/ABNT2/BIG_ASS sí.
- La geometría visual (forma del Enter, ancho del Shift, etc. — `KEYBOARD_GEOMETRY_BY_FAMILY` en `Keyboard.tsx`).

### Cómo la elige el usuario

`components/lessons/KeyboardDetectionWizard.tsx` — un wizard de preguntas visuales (forma del Enter, si es ABNT, conteo de teclas para distinguir JIS/KS) que **no pregunta idioma ni distribución lógica en absoluto**. Al terminar, llama `onSelectPhysicalFamily` → `setPhysicalFamily` del contexto.

### Persistencia y desacoplamiento

En `contexts/KeyboardLayoutContext.tsx`:
- `selectedLayoutId` (distribución lógica) y `physicalFamily` son estados **separados**, cada uno con su propia clave de `localStorage` (`KEYBOARD_LAYOUT_STORAGE_KEY` / `KEYBOARD_PHYSICAL_FAMILY_STORAGE_KEY`).
- `setSelectedLayout()` nunca toca `physicalFamily`. `setPhysicalFamily()` nunca toca `selectedLayoutId`.
- **Única excepción**: si el usuario nunca configuró `physicalFamily` (primera vez), se inicializa una vez tomando `layout.physicalType` de la distribución lógica activa como valor de arranque (comentario en el código: *"El idioma define los caracteres; la familia física se conserva aparte"*). Después de esa inicialización, cambiar una no afecta a la otra.
- Si el usuario está logueado, la distribución lógica también se persiste en backend (`updateMyPreferences`); la familia física solo vive en `localStorage`.

---

## 3. Cómo se arma el dropdown de opciones (idioma → distribuciones)

`components/lessons/TypingArea.tsx` renderiza el selector manual de distribución usando:

```ts
getLayoutsForLanguage(lang) // del contexto, lang = idioma de interfaz de la URL
```

que delega en `getEnabledLayoutsForLocale(locale, physicalFamily)` (`keyboardLayouts.ts`, ~línea 1476):

```ts
export function getEnabledLayoutsForLocale(locale, physicalFamily) {
  return getEnabledLayouts()
    .filter((layout) => layoutSupportsLocale(layout, locale))   // ← único filtro real
    .map((layout) => getKeyboardLayoutCompatibility(layout, physicalFamily))
    .sort(/* compatible primero, luego preferido para esa familia, luego alfabético */);
}
```

**El único filtro es `languageCodes`.** La familia física **nunca oculta** una distribución de la lista — solo afecta el orden (compatibles con la familia física actual aparecen primero). Además, ese detalle de compatibilidad/orden no se muestra en la UI actual (no hay badge, separador ni texto de advertencia): `KeyboardLayoutContext.tsx` descarta esa metadata (`.map(({ layout }) => layout)`) antes de devolver la lista al dropdown.

**Implicación práctica**: agregarle a una distribución el `languageCodes` de un idioma cuyos usuarios típicamente usan otra familia física (ej. asignarle un idioma "ISO" a una distribución con `physicalType: 'ANSI'`) es seguro — la distribución va a aparecer igual en el dropdown, sin ocultarse ni romperse.

---

## 4. Render del teclado en pantalla (`components/lessons/Keyboard.tsx`)

`getKeyboardSvgData(layoutId, physicalFamily?)` (definida en el propio `Keyboard.tsx`, ~línea 475):

1. Resuelve la distribución lógica por `layoutId`.
2. Resuelve la familia física a usar: **si se pasa `physicalFamily` explícitamente, esa gana siempre**; solo si no se pasa nada cae al `physicalType` nativo de la distribución (`getKeyboardPhysicalFamily(layout)` = `layout.physicalType ?? 'ISO'`).
3. Con la familia física resuelta, toma las filas de `PHYSICAL_KEY_ID_ROWS[family]` — esto define la **geometría** (qué teclas hay, en qué orden, qué forma).
4. Para cada `PhysicalKeyId` de esas filas, consulta `getKeyOutput(layout, physicalKeyId)` para saber qué carácter mostrar.

`Keyboard.tsx` (el componente, no la función) siempre le pasa la `physicalFamily` guardada en el contexto (la que el usuario configuró vía el wizard), así que en la práctica el render **siempre usa la familia física real del usuario**, sin importar qué `physicalType` tenga declarado la distribución lógica elegida.

### Qué pasa si la distribución lógica y la familia física no coinciden

No se rompe nada ni se ve "mal formado". El teclado se dibuja **con la forma de la familia física del usuario** (ej. ISO: Enter en L, Shift izquierdo corto, tecla extra junto al Shift). Los caracteres se toman de la distribución lógica elegida para cada `PhysicalKeyId` que esa familia expone.

El único caso imperfecto: si la distribución lógica **nunca definió** carácter para algún `PhysicalKeyId` exclusivo de la familia física del usuario (ej. una distribución pensada originalmente para ANSI, usada por alguien con teclado ISO real — le falta `P43`, la tecla extra junto al Shift izquierdo que ANSI no tiene), esa tecla puntual se dibuja **vacía** en el SVG (`?? ''`). No es un error, es simplemente una tecla sin carácter asignado.

**Estado verificado (2026-08-11)**: las distribuciones genéricas reutilizadas entre idiomas — `qwerty-us-intl`, `dvorak`, `colemak` — tienen `physicalType: 'ANSI'` y **ninguna define `P43`**. Un usuario con teclado físico ISO real (la mayoría en Europa) que elija alguna de estas como distribución alternativa va a ver esa única tecla vacía en el teclado en pantalla.

---

## 5. Resumen visual del flujo

```
Idioma de interfaz (URL /[lang]/...)
        │
        ▼
getLayoutsForLanguage(lang) ──► filtra KEYBOARD_LAYOUTS por languageCodes
        │                        (familia física NO filtra, solo ordena)
        ▼
Usuario elige una distribución lógica (dropdown en TypingArea.tsx)
        │
        ▼
selectedLayoutId  ──────────────────┐
        │                            │  (estados independientes,
Familia física (KeyboardDetection    │   sin sincronización entre sí
Wizard, separado del idioma)         │   salvo en la inicialización)
        │                            │
        ▼                            ▼
   physicalFamily ──────► getKeyboardSvgData(layoutId, physicalFamily)
                                  │
                                  ├─ geometría (filas/forma) = según physicalFamily
                                  └─ carácter por tecla = según layout lógico,
                                     consultado por PhysicalKeyId
                                  │
                                  ▼
                          Keyboard.tsx dibuja el SVG
```

---

## Archivos relevantes

| Archivo | Responsabilidad |
|---|---|
| `front-end/lib/keyboardLayouts.ts` | Catálogo de distribuciones lógicas, filtrado/orden por idioma, teclas muertas. |
| `front-end/lib/keyboardPhysical.ts` | `PhysicalKeyId`, filas por familia física, mapeo `event.code` → `PhysicalKeyId`. |
| `front-end/lib/keyMappings.ts` | Resolución carácter ↔ tecla física (`resolveCharacterToPhysicalKey`, usado para guías visuales). |
| `front-end/lib/keyboardGuides/` | Cálculo de qué teclas resaltar en el teclado para guiar al usuario a un carácter objetivo. |
| `front-end/contexts/KeyboardLayoutContext.tsx` | Estado global: distribución lógica activa + familia física, persistencia. |
| `front-end/components/lessons/Keyboard.tsx` | Render SVG del teclado (`getKeyboardSvgData`, geometría, teclas activas/guía). |
| `front-end/components/lessons/KeyboardDetectionWizard.tsx` | Wizard de detección de familia física. |
| `front-end/components/lessons/TypingArea.tsx` | Dropdown de selección manual de distribución lógica por idioma. |
