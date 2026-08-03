const { CourseLevel, LanguageCode, LayoutCode } = require('@prisma/client');

const SPACE = ' ';

function characters(value) {
  return [...new Set(Array.from(value))];
}

function practice({
  slug,
  title,
  description,
  objective,
  content,
  focusKeys,
  reviewKeys = [],
  allowed,
  order,
  difficulty = 1,
  estimatedSeconds = 45,
  minAccuracy = 90,
  requiredSuccessfulAttempts = 1,
  maxTargetKeyErrors = 3,
  hideLiveWpm = false,
  instructions = 'Escribe con calma y presta atención a la ortografía.',
}) {
  return {
    slug,
    title,
    description,
    objective,
    instructions,
    content,
    type: 'practice',
    focusKeys,
    reviewKeys,
    allowedCharacters: characters(allowed),
    targetKeys: focusKeys,
    difficulty,
    estimatedSeconds,
    minAccuracy,
    maxTargetKeyErrors,
    requiredSuccessfulAttempts,
    hideLiveWpm,
    mediaUrl: null,
    audioUrl: null,
    required: true,
    order,
  };
}

function introduction({
  slug,
  title,
  description,
  objective,
  content,
  targetKeys,
  focusKeys = targetKeys,
  reviewKeys = [],
  order,
  difficulty = 1,
  estimatedSeconds = 30,
}) {
  return {
    slug,
    title,
    description,
    objective,
    instructions: 'Lee atentamente la explicación antes de continuar.',
    content,
    type: 'explanatory',
    focusKeys,
    reviewKeys,
    allowedCharacters: [],
    targetKeys,
    difficulty,
    estimatedSeconds,
    minAccuracy: 100,
    maxTargetKeyErrors: 0,
    requiredSuccessfulAttempts: 1,
    hideLiveWpm: true,
    mediaUrl: null,
    audioUrl: null,
    required: true,
    order,
  };
}

const course = {
  slug: 'curso-ortografia-es',
  name: 'Ortografía',
  description:
    'Curso completo de ortografía. Aprende las reglas de acentuación, uso de letras, signos de puntuación y palabras homófonas.',
  languageCode: LanguageCode.es,
  localeCode: 'es-latam',
  level: CourseLevel.BEGINNER,
  supportedLayouts: [LayoutCode.QWERTY_ES, LayoutCode.QWERTY_LATAM],
  curriculumVersion: 1,
  estimatedMinutes: 240,
  modules: [
    {
      slug: 'fundamentos-basicos',
      title: 'Fundamentos Básicos',
      description: 'Reglas fundamentales de ortografía: mayúsculas y acentuación.',
      order: 1,
      lessons: [
        introduction({
          slug: 'ortografia-mayusculas-intro',
          title: 'Uso de Mayúsculas - Introducción',
          description: 'Reglas básicas para el uso de mayúsculas.',
          objective: 'Identificar cuándo usar mayúsculas correctamente.',
          content:
            'Las mayúsculas se usan al inicio de una oración, en nombres propios, títulos y después de punto. También en nombres de lugares, instituciones y obras artísticas.',
          targetKeys: ['Mayúsculas'],
          order: 1,
        }),
        practice({
          slug: 'ortografia-mayusculas-1',
          title: 'Mayúsculas en Oraciones',
          description: 'Practica escribiendo oraciones con mayúsculas.',
          objective: 'Escribir oraciones usando mayúsculas correctamente.',
          content: 'El perro corre. María come pan. Hoy es lunes. Pedro estudia. Ana canta bien.',
          focusKeys: ['e', 'l', 'p', 'm', 'c', 'h', 'a', 'b'],
          reviewKeys: ['o', 'r', 's', 't', 'n', 'd'],
          allowed: `ElperrocorreMaríacomepanHoyeslunesPedroestudiaAnacantabien${SPACE}`,
          order: 2,
        }),
        practice({
          slug: 'ortografia-mayusculas-2',
          title: 'Mayúsculas en Nombres Propios',
          description: 'Practica escribiendo nombres propios.',
          objective: 'Usar mayúsculas en nombres de personas y lugares.',
          content: 'Juan Madrid Ana París Carlos Roma Luis México Sara Tokio',
          focusKeys: ['j', 'm', 'a', 'p', 'c', 'r', 'l', 's', 't'],
          reviewKeys: ['n', 'd', 'o', 'i', 'e'],
          allowed: `JuanMadridAnaParísCarlosRomaLuisMéxicoSaraTokio${SPACE}`,
          order: 3,
        }),
        practice({
          slug: 'ortografia-mayusculas-3',
          title: 'Mayúsculas en Títulos',
          description: 'Practica escribiendo títulos con mayúsculas.',
          objective: 'Usar mayúsculas correctamente en títulos de obras.',
          content: 'El Quijote La Celestina El Cid Don Juan Tenorio La Odisea',
          focusKeys: ['e', 'l', 'c', 'd', 'o', 'q', 't'],
          reviewKeys: ['a', 'i', 'u', 'r', 's', 'n'],
          allowed: `ElQuijoteLaCelestinaElCidDonJuanTenorioLaOdisea${SPACE}`,
          order: 4,
        }),
        introduction({
          slug: 'ortografia-acentuacion-intro',
          title: 'Reglas de Acentuación',
          description: 'Introducción a las reglas de acentuación.',
          objective: 'Comprender las reglas de acentuación en español.',
          content:
            'Las palabras se clasifican en agudas, graves y esdrújulas según la posición de la sílaba tónica. Las agudas llevan tilde si terminan en vocal, n o s. Las graves llevan tilde si terminan en consonante que no sea n o s. Las esdrújulas siempre llevan tilde.',
          targetKeys: ['Acentuación'],
          order: 5,
        }),
        practice({
          slug: 'ortografia-acentuacion-agudas',
          title: 'Palabras Agudas',
          description: 'Practica palabras agudas con tilde.',
          objective: 'Identificar y escribir palabras agudas correctamente.',
          content: 'camión canción avión corazón razón emoción león acción',
          focusKeys: ['c', 'a', 'n', 'i', 'ó', 'e', 'l', 'r', 'z'],
          reviewKeys: ['m', 's', 'd'],
          allowed: `camióncanciónavióncorazónrazónemociónleónacción${SPACE}`,
          order: 6,
        }),
        practice({
          slug: 'ortografia-acentuacion-agudas-2',
          title: 'Palabras Agudas - Más Ejemplos',
          description: 'Más palabras agudas para practicar.',
          objective: 'Reforzar la acentuación de palabras agudas.',
          content: 'balón jabón montón colchón sillón camión cajón ratón',
          focusKeys: ['b', 'j', 'm', 'c', 's', 'r', 'ó', 'á'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 'n'],
          allowed: `balónjabónmontóncolchónsillóncamióncajónratón${SPACE}`,
          order: 7,
        }),
        practice({
          slug: 'ortografia-acentuacion-graves',
          title: 'Palabras Graves',
          description: 'Practica palabras graves con tilde.',
          objective: 'Identificar y escribir palabras graves correctamente.',
          content: 'árbol fácil difícil útil túnel césped mármol ángel',
          focusKeys: ['á', 'r', 'b', 'f', 'c', 'd', 'ú', 't', 'é', 'm', 'l', 'n', 'g'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u'],
          allowed: `árbolfácildifícilútiltúnelcéspedmármolángel${SPACE}`,
          order: 8,
        }),
        practice({
          slug: 'ortografia-acentuacion-graves-2',
          title: 'Palabras Graves - Más Ejemplos',
          description: 'Más palabras graves para practicar.',
          objective: 'Reforzar la acentuación de palabras graves.',
          content: 'cárcel lápiz sílaba árboles fósil clásico cáncer',
          focusKeys: ['á', 'c', 'l', 'p', 'f', 'ó', 'é', 's'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 'r', 'n'],
          allowed: `cárcellápizsílabaárbolesfósilclásicocáncer${SPACE}`,
          order: 9,
        }),
        practice({
          slug: 'ortografia-acentuacion-esdrujulas',
          title: 'Palabras Esdrújulas',
          description: 'Practica palabras esdrújulas.',
          objective: 'Identificar y escribir palabras esdrújulas correctamente.',
          content: 'pájaro médico teléfono música rápida lágrima plástico',
          focusKeys: ['p', 'á', 'j', 'm', 'é', 't', 'r', 's', 'l'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 'n', 'd'],
          allowed: `pájaromédicoteléfonomúsicarápidalágrimaplástico${SPACE}`,
          order: 10,
        }),
        practice({
          slug: 'ortografia-acentuacion-esdrujulas-2',
          title: 'Palabras Esdrújulas - Más Ejemplos',
          description: 'Más palabras esdrújulas para practicar.',
          objective: 'Reforzar la acentuación de palabras esdrújulas.',
          content: 'brújula mísero cántaro fantástico sábado matemáticas',
          focusKeys: ['b', 'm', 'c', 'f', 's', 't', 'á', 'é', 'í', 'ú'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 'r', 'l', 'n'],
          allowed: `brújulamíserocántarofantásticosábadomatemáticas${SPACE}`,
          order: 11,
        }),
        practice({
          slug: 'ortografia-acentuacion-sobreesdrujulas',
          title: 'Palabras Sobreesdrújulas',
          description: 'Practica palabras sobreesdrújulas.',
          objective: 'Identificar y escribir palabras sobreesdrújulas correctamente.',
          content: 'dígamelo explícamelo rápidamente fácilmente últimamente',
          focusKeys: ['d', 'e', 'r', 'f', 'u', 'á', 'í'],
          reviewKeys: ['a', 'i', 'o', 'u', 'm', 'l', 'n', 's'],
          allowed: `dígameloexplícamelorápidamentefácilmenteúltimamente${SPACE}`,
          order: 12,
        }),
      ],
    },
    {
      slug: 'uso-de-letras',
      title: 'Uso de Letras',
      description: 'Reglas para el uso correcto de B, V, C, S, Z, G, J, H, LL, Y, R, RR y X.',
      order: 2,
      lessons: [
        introduction({
          slug: 'ortografia-b-v-intro',
          title: 'Uso de B y V - Introducción',
          description: 'Reglas para usar B y V correctamente.',
          objective: 'Diferenciar el uso de B y V.',
          content:
            'La B se usa en verbos terminados en -bir, -aba, -abas, y en palabras con bu-, bur-, bus-. La V se usa en verbos terminados en -venir, -ver y en palabras con vice-, villa-. También en adjetivos terminados en -ava, -ave, -avo, -eva, -eve, -evo, -iva, -ive, -ivo.',
          targetKeys: ['B', 'V'],
          order: 13,
        }),
        practice({
          slug: 'ortografia-b-v-1',
          title: 'Practicando B y V - Parte 1',
          description: 'Practica palabras con B y V.',
          objective: 'Escribir correctamente palabras con B y V.',
          content: 'bien vino bebé verbo bueno vivo barco vela blanco vaso',
          focusKeys: ['b', 'v'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 'n', 'r', 'l', 's'],
          allowed: `abcdefghijklmnñopqrstuvwxyz${SPACE}`,
          order: 14,
        }),
        practice({
          slug: 'ortografia-b-v-2',
          title: 'Practicando B y V - Parte 2',
          description: 'Más palabras con B y V.',
          objective: 'Reforzar el uso correcto de B y V.',
          content: 'libro abrir beber vivir haber saber caballo viento verdad',
          focusKeys: ['b', 'v'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 'r', 'l', 's', 'n'],
          allowed: `abcdefghijklmnñopqrstuvwxyz${SPACE}`,
          order: 15,
        }),
        practice({
          slug: 'ortografia-b-v-3',
          title: 'Practicando B y V - Parte 3',
          description: 'Más palabras con B y V para practicar.',
          objective: 'Dominar el uso correcto de B y V.',
          content: 'buscar burbuja subir bello valle villa hablar deber',
          focusKeys: ['b', 'v'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 'r', 'l', 's', 'n', 'd'],
          allowed: `abcdefghijklmnñopqrstuvwxyz${SPACE}`,
          order: 16,
        }),
        introduction({
          slug: 'ortografia-c-s-z-intro',
          title: 'Uso de C, S y Z - Introducción',
          description: 'Reglas para usar C, S y Z correctamente.',
          objective: 'Diferenciar el uso de C, S y Z.',
          content:
            'La C se usa antes de A, O, U y en palabras con -ción. La S se usa en palabras con -ense, -oso, -osa, -esa, -isa. La Z se usa en palabras con -ez, -eza y antes de A, O, U. También en verbos terminados en -zar.',
          targetKeys: ['C', 'S', 'Z'],
          order: 17,
        }),
        practice({
          slug: 'ortografia-c-s-z-1',
          title: 'Practicando C, S y Z - Parte 1',
          description: 'Practica palabras con C, S y Z.',
          objective: 'Escribir correctamente palabras con C, S y Z.',
          content: 'casa salsa cereza zumo cien cena espacio zapato cielo',
          focusKeys: ['c', 's', 'z'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 'n', 'r', 'l'],
          allowed: `abcdefghijklmnñopqrstuvwxyz${SPACE}`,
          order: 18,
        }),
        practice({
          slug: 'ortografia-c-s-z-2',
          title: 'Practicando C, S y Z - Parte 2',
          description: 'Más palabras con C, S y Z.',
          objective: 'Reforzar el uso correcto de C, S y Z.',
          content: 'luz paz voz pez vez cruz feliz capaz diez',
          focusKeys: ['c', 's', 'z'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 'r', 'l', 'n'],
          allowed: `abcdefghijklmnñopqrstuvwxyz${SPACE}`,
          order: 19,
        }),
        practice({
          slug: 'ortografia-c-s-z-3',
          title: 'Practicando C, S y Z - Parte 3',
          description: 'Más palabras con C, S y Z para practicar.',
          objective: 'Dominar el uso correcto de C, S y Z.',
          content: 'feliz raíz actriz pez lápiz paz andanza cerebro',
          focusKeys: ['c', 's', 'z'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 'r', 'l', 'n', 'p'],
          allowed: `abcdefghijklmnñopqrstuvwxyz${SPACE}`,
          order: 20,
        }),
        introduction({
          slug: 'ortografia-g-j-intro',
          title: 'Uso de G y J - Introducción',
          description: 'Reglas para usar G y J correctamente.',
          objective: 'Diferenciar el uso de G y J.',
          content:
            'La G se usa en palabras con -gia, -gio, -gente, -gen, y en verbos terminados en -ger, -gir. La J se usa en palabras con -aje, -eje, -jería, y en verbos terminados en -jar. También en palabras que comienzan con aje- y eje-.',
          targetKeys: ['G', 'J'],
          order: 21,
        }),
        practice({
          slug: 'ortografia-g-j-1',
          title: 'Practicando G y J - Parte 1',
          description: 'Practica palabras con G y J.',
          objective: 'Escribir correctamente palabras con G y J.',
          content: 'gato gente jefe jardín jugar genial viaje jabón gratis',
          focusKeys: ['g', 'j'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 'n', 'r', 'l', 's'],
          allowed: `abcdefghijklmnñopqrstuvwxyz${SPACE}`,
          order: 22,
        }),
        practice({
          slug: 'ortografia-g-j-2',
          title: 'Practicando G y J - Parte 2',
          description: 'Más palabras con G y J.',
          objective: 'Reforzar el uso correcto de G y J.',
          content: 'coraje mensaje reloj viaje jamón jardín joven girasol',
          focusKeys: ['g', 'j'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 'r', 'l', 's', 'n'],
          allowed: `abcdefghijklmnñopqrstuvwxyz${SPACE}`,
          order: 23,
        }),
        practice({
          slug: 'ortografia-g-j-3',
          title: 'Practicando G y J - Parte 3',
          description: 'Más palabras con G y J para practicar.',
          objective: 'Dominar el uso correcto de G y J.',
          content: 'girar coger elegir jardinero agujero mujer crujir',
          focusKeys: ['g', 'j'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 'r', 'l', 's', 'n', 'd'],
          allowed: `abcdefghijklmnñopqrstuvwxyz${SPACE}`,
          order: 24,
        }),
        introduction({
          slug: 'ortografia-h-intro',
          title: 'Uso de H - Introducción',
          description: 'Reglas para usar H correctamente.',
          objective: 'Identificar cuándo usar H.',
          content:
            'La H se usa en palabras que comienzan con hie-, hue-, hui-, en verbos haber, hacer, hallar, y en palabras compuestas con hi-. También en palabras que comienzan con hum- y en algunas excepciones.',
          targetKeys: ['H'],
          order: 25,
        }),
        practice({
          slug: 'ortografia-h-1',
          title: 'Practicando H - Parte 1',
          description: 'Practica palabras con H.',
          objective: 'Escribir correctamente palabras con H.',
          content: 'hoy haber hacer hielo huevo humo hilo hormiga hueso',
          focusKeys: ['h'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 'r', 'l', 's', 'n'],
          allowed: `abcdefghijklmnñopqrstuvwxyz${SPACE}`,
          order: 26,
        }),
        practice({
          slug: 'ortografia-h-2',
          title: 'Practicando H - Parte 2',
          description: 'Más palabras con H.',
          objective: 'Reforzar el uso correcto de H.',
          content: 'ahora hospital helado huerta ahogar heredar hambre hoja',
          focusKeys: ['h'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 'r', 'l', 's', 'n'],
          allowed: `abcdefghijklmnñopqrstuvwxyz${SPACE}`,
          order: 27,
        }),
        practice({
          slug: 'ortografia-h-3',
          title: 'Practicando H - Parte 3',
          description: 'Más palabras con H para practicar.',
          objective: 'Dominar el uso correcto de H.',
          content: 'humor haber hiato huida heno hiedra halcón herida',
          focusKeys: ['h'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 'r', 'l', 's', 'n', 'd'],
          allowed: `abcdefghijklmnñopqrstuvwxyz${SPACE}`,
          order: 28,
        }),
        introduction({
          slug: 'ortografia-ll-y-intro',
          title: 'Uso de LL y Y - Introducción',
          description: 'Reglas para usar LL y Y correctamente.',
          objective: 'Diferenciar el uso de LL y Y.',
          content:
            'La LL se usa en palabras con -illo, -illa, y en verbos que terminan en -llar. La Y se usa como conjunción, en palabras con -y- después de vocal, y en verbos terminados en -uir. También en palabras con -y- al final.',
          targetKeys: ['LL', 'Y'],
          order: 29,
        }),
        practice({
          slug: 'ortografia-ll-y-1',
          title: 'Practicando LL y Y - Parte 1',
          description: 'Practica palabras con LL y Y.',
          objective: 'Escribir correctamente palabras con LL y Y.',
          content: 'llave calle yate yema pollo botella mayonesa lluvia',
          focusKeys: ['l', 'y'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 'r', 's', 'n'],
          allowed: `abcdefghijklmnñopqrstuvwxyz${SPACE}`,
          order: 30,
        }),
        practice({
          slug: 'ortografia-ll-y-2',
          title: 'Practicando LL y Y - Parte 2',
          description: 'Más palabras con LL y Y.',
          objective: 'Reforzar el uso correcto de LL y Y.',
          content: 'bello sello yerno yodo olla silla apoyar ayudar',
          focusKeys: ['l', 'y'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 'r', 's', 'n'],
          allowed: `abcdefghijklmnñopqrstuvwxyz${SPACE}`,
          order: 31,
        }),
        practice({
          slug: 'ortografia-ll-y-3',
          title: 'Practicando LL y Y - Parte 3',
          description: 'Más palabras con LL y Y para practicar.',
          objective: 'Dominar el uso correcto de LL y Y.',
          content: 'cocina y lluvia yegua calle yema llama yate cállate',
          focusKeys: ['l', 'y'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 'r', 's', 'n', 'c'],
          allowed: `abcdefghijklmnñopqrstuvwxyz${SPACE}`,
          order: 32,
        }),
        introduction({
          slug: 'ortografia-r-rr-intro',
          title: 'Uso de R y RR - Introducción',
          description: 'Reglas para usar R y RR correctamente.',
          objective: 'Diferenciar el uso de R y RR.',
          content:
            'La R se usa al inicio de palabra, después de N, L, S, y en posición intermedia suave. La RR se usa entre vocales para sonido fuerte. También en palabras compuestas donde la segunda palabra comienza con R.',
          targetKeys: ['R', 'RR'],
          order: 33,
        }),
        practice({
          slug: 'ortografia-r-rr-1',
          title: 'Practicando R y RR - Parte 1',
          description: 'Practica palabras con R y RR.',
          objective: 'Escribir correctamente palabras con R y RR.',
          content: 'perro carro parra rápido regla río enredar arroz',
          focusKeys: ['r'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 'p', 'c', 'n', 's'],
          allowed: `abcdefghijklmnñopqrstuvwxyz${SPACE}`,
          order: 34,
        }),
        practice({
          slug: 'ortografia-r-rr-2',
          title: 'Practicando R y RR - Parte 2',
          description: 'Más palabras con R y RR.',
          objective: 'Reforzar el uso correcto de R y RR.',
          content: 'tierra barro remo ratón arena irreal alrededor',
          focusKeys: ['r'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 't', 'b', 'm', 'l'],
          allowed: `abcdefghijklmnñopqrstuvwxyz${SPACE}`,
          order: 35,
        }),
        practice({
          slug: 'ortografia-r-rr-3',
          title: 'Practicando R y RR - Parte 3',
          description: 'Más palabras con R y RR para practicar.',
          objective: 'Dominar el uso correcto de R y RR.',
          content: 'carrera sonrisa correr florero alrededor torre carro',
          focusKeys: ['r'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 'c', 'n', 's', 'l', 't'],
          allowed: `abcdefghijklmnñopqrstuvwxyz${SPACE}`,
          order: 36,
        }),
        introduction({
          slug: 'ortografia-x-intro',
          title: 'Uso de X - Introducción',
          description: 'Reglas para usar X correctamente.',
          objective: 'Identificar cuándo usar X.',
          content:
            'La X se usa en palabras con ex- + vocal, en palabras con -x- entre vocales, y en préstamos como xilófono, xerox. También en palabras que comienzan con xeno- y xilo-.',
          targetKeys: ['X'],
          order: 37,
        }),
        practice({
          slug: 'ortografia-x-1',
          title: 'Practicando X - Parte 1',
          description: 'Practica palabras con X.',
          objective: 'Escribir correctamente palabras con X.',
          content: 'examen exacto éxito expresar extender textura explosión',
          focusKeys: ['x'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 'r', 's', 'n', 'l'],
          allowed: `abcdefghijklmnñopqrstuvwxyz${SPACE}`,
          order: 38,
        }),
        practice({
          slug: 'ortografia-x-2',
          title: 'Practicando X - Parte 2',
          description: 'Más palabras con X para practicar.',
          objective: 'Reforzar el uso correcto de X.',
          content: 'xilófono xenófobo texto próximo excelente explicación',
          focusKeys: ['x'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 'r', 's', 'n', 'l', 'p'],
          allowed: `abcdefghijklmnñopqrstuvwxyz${SPACE}`,
          order: 39,
        }),
      ],
    },
    {
      slug: 'signos-puntuacion',
      title: 'Signos de Puntuación',
      description:
        'Uso correcto de punto, coma, dos puntos, signos de exclamación e interrogación, comillas y paréntesis.',
      order: 3,
      lessons: [
        introduction({
          slug: 'ortografia-puntuacion-intro',
          title: 'Introducción a la Puntuación',
          description: 'Importancia de los signos de puntuación.',
          objective: 'Comprender la función de los signos de puntuación.',
          content:
            'Los signos de puntuación organizan el texto, marcan pausas y entonación, y evitan ambigüedades. Son esenciales para la claridad y comprensión del mensaje.',
          targetKeys: ['Puntuación'],
          order: 40,
        }),
        practice({
          slug: 'ortografia-punto-coma-1',
          title: 'Uso del Punto y la Coma - Parte 1',
          description: 'Practica el uso del punto y la coma.',
          objective: 'Escribir oraciones con punto y coma correctamente.',
          content:
            'Hoy es lunes. Mañana será martes. Compré pan, leche y huevos. El perro corre y el gato duerme.',
          focusKeys: ['e', 'l', 'p', 'm', 'c', 'h', 'a', 'b'],
          reviewKeys: ['o', 'r', 's', 't', 'n', 'd'],
          allowed: `HoyeslunesMañanaserámartesComprépanlecheyhuevosElperrocorreelgatoduerme.,${SPACE}`,
          order: 41,
        }),
        practice({
          slug: 'ortografia-punto-coma-2',
          title: 'Uso del Punto y la Coma - Parte 2',
          description: 'Más práctica con punto y coma.',
          objective: 'Reforzar el uso correcto del punto y la coma.',
          content:
            'Voy al cine, pero no tengo dinero. El coche es rojo, grande y rápido. Llegué, vi y vencí.',
          focusKeys: ['v', 'c', 'd', 'l', 't', 'p', 'r', 'g'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 's', 'n'],
          allowed: `VoyalcineperonotengodineroElcocheesrojograndeyrápidoLleguéviyvencí.,${SPACE}`,
          order: 42,
        }),
        practice({
          slug: 'ortografia-punto-y-seguido',
          title: 'Punto y Seguido',
          description: 'Practica el uso del punto y seguido.',
          objective: 'Usar correctamente el punto y seguido en textos.',
          content:
            'Era una tarde de verano. El sol brillaba. Las flores olían bien. Los pájaros cantaban.',
          focusKeys: ['e', 's', 'l', 'f', 'p', 'c', 'b', 'd'],
          reviewKeys: ['a', 'i', 'o', 'u', 'r', 'n', 't'],
          allowed: `EraunatardedeVeranoElsolbrillabaLasfloresolíanbienLospájaroscantaban.${SPACE}`,
          order: 43,
        }),
        practice({
          slug: 'ortografia-dos-puntos-1',
          title: 'Uso de los Dos Puntos - Parte 1',
          description: 'Practica el uso de los dos puntos.',
          objective: 'Escribir oraciones con dos puntos correctamente.',
          content: 'Los colores son: rojo, azul y verde. Mi hermana dice: "Voy al cine".',
          focusKeys: ['l', 'c', 'm', 'h', 'v', 'a', 'e'],
          reviewKeys: ['o', 'r', 's', 't', 'n', 'd', 'u'],
          allowed: `LoscoloresonrojoazulyverdeMihermanadiceVoyalcine":${SPACE}`,
          order: 44,
        }),
        practice({
          slug: 'ortografia-dos-puntos-2',
          title: 'Uso de los Dos Puntos - Parte 2',
          description: 'Más práctica con dos puntos.',
          objective: 'Reforzar el uso correcto de los dos puntos.',
          content: 'Los ingredientes son: harina, huevos y leche. Pienso: "Todo saldrá bien".',
          focusKeys: ['l', 'h', 'p', 's', 't', 'a', 'e'],
          reviewKeys: ['o', 'r', 'i', 'n', 'd', 'u'],
          allowed: `LosingredientesonharinahuevosylechePiensoTodosaldrábien":${SPACE}`,
          order: 45,
        }),
        practice({
          slug: 'ortografia-exclamacion-interrogacion-1',
          title: 'Signos de Exclamación e Interrogación - Parte 1',
          description: 'Practica el uso de ¡! y ¿?.',
          objective: 'Escribir oraciones exclamativas e interrogativas correctamente.',
          content: '¿Cómo estás? ¡Qué bien! ¿Dónde vas? ¡Ven aquí! ¡Qué bonito! ¿Cómo te llamas?',
          focusKeys: ['c', 'e', 'v', 'b', 'q', 'l'],
          reviewKeys: ['a', 'o', 's', 't', 'n', 'd', 'm'],
          allowed: `CómoestásQuébienDóndevasVenaquíQuébonitoComotellamas¿¡?!${SPACE}`,
          order: 46,
        }),
        practice({
          slug: 'ortografia-exclamacion-interrogacion-2',
          title: 'Signos de Exclamación e Interrogación - Parte 2',
          description: 'Más práctica con ¡! y ¿?.',
          objective: 'Reforzar el uso correcto de ¡! y ¿?.',
          content: '¿Qué hora es? ¡Qué sorpresa! ¿Cómo pudiste? ¡No lo entiendo!',
          focusKeys: ['q', 'h', 's', 'c', 'p', 'n', 'e', 'o'],
          reviewKeys: ['a', 'i', 'u', 'r', 'l', 't'],
          allowed: `QuéhoraesQuésorpresaComopudisteNoloentiendo¿¡?!${SPACE}`,
          order: 47,
        }),
        practice({
          slug: 'ortografia-comillas-parentesis-1',
          title: 'Comillas y Paréntesis - Parte 1',
          description: 'Practica el uso de comillas y paréntesis.',
          objective: 'Escribir oraciones con comillas y paréntesis correctamente.',
          content: 'Juan dijo: "Voy a la tienda". El libro (el más vendido) es interesante.',
          focusKeys: ['j', 'v', 'e', 'l', 'i', 'm', 'p'],
          reviewKeys: ['a', 'o', 's', 't', 'n', 'd', 'c'],
          allowed: `JuandijoVoyalatiendaEllibroelmasvendidoesinteresante"()${SPACE}`,
          order: 48,
        }),
        practice({
          slug: 'ortografia-comillas-parentesis-2',
          title: 'Comillas y Paréntesis - Parte 2',
          description: 'Más práctica con comillas y paréntesis.',
          objective: 'Reforzar el uso correcto de comillas y paréntesis.',
          content: 'Ella dijo: "Llegaré tarde". La reunión (programada para hoy) se cancela.',
          focusKeys: ['e', 'l', 't', 'r', 'p', 'h', 's', 'c'],
          reviewKeys: ['a', 'i', 'o', 'u', 'n', 'd'],
          allowed: `ElladijoLLegarétardeLareuniónprogramadaparahoysesancela"()${SPACE}`,
          order: 49,
        }),
        practice({
          slug: 'ortografia-punto-final',
          title: 'Punto Final',
          description: 'Practica el uso del punto final.',
          objective: 'Usar correctamente el punto final en textos.',
          content: 'El cuento ha terminado. Todos vivieron felices. El fin.',
          focusKeys: ['e', 'c', 't', 'v', 'f', 'd'],
          reviewKeys: ['a', 'o', 'i', 'u', 'r', 's', 'n', 'l'],
          allowed: `ElcuentohaterminadoTodosvivieronfelicesElfin.${SPACE}`,
          order: 50,
        }),
      ],
    },
    {
      slug: 'palabras-homofonas',
      title: 'Palabras Homófonas',
      description: 'Diferenciación de palabras que suenan igual pero se escriben diferente.',
      order: 4,
      lessons: [
        introduction({
          slug: 'ortografia-homofonas-intro',
          title: 'Introducción a Palabras Homófonas',
          description: '¿Qué son las palabras homófonas?',
          objective: 'Identificar palabras homófonas y sus diferencias.',
          content:
            'Las palabras homófonas suenan igual pero tienen diferente significado y escritura. Ejemplo: hay/ahí/ay, haber/a ver, vaya/valla. Es importante conocerlas para escribir correctamente.',
          targetKeys: ['Homófonas'],
          order: 51,
        }),
        practice({
          slug: 'ortografia-homofonas-1',
          title: 'Hay/Ahí/Ay',
          description: 'Practica el uso correcto de hay, ahí y ay.',
          objective: 'Diferenciar y usar correctamente hay, ahí y ay.',
          content: 'Hay un libro ahí. Ay, qué dolor. Hay que estudiar. Ponlo ahí. Hay comida.',
          focusKeys: ['h', 'a', 'y'],
          reviewKeys: ['e', 'i', 'o', 'u', 'l', 'r', 's', 'n'],
          allowed: `HayunlibroahíAyquedolorHayqueestudiarPonloahíHaycomida${SPACE}`,
          order: 52,
        }),
        practice({
          slug: 'ortografia-homofonas-2',
          title: 'Haber/A Ver',
          description: 'Practica el uso correcto de haber y a ver.',
          objective: 'Diferenciar y usar correctamente haber y a ver.',
          content:
            'Debe haber solución. Vamos a ver la película. Puede haber problemas. A ver qué pasa.',
          focusKeys: ['h', 'a', 'v', 'e', 'r'],
          reviewKeys: ['o', 'u', 'l', 's', 'n', 'd'],
          allowed: `DebehabersoluciónVamosaverlapelículaPuedehaberproblemasAverquépasa${SPACE}`,
          order: 53,
        }),
        practice({
          slug: 'ortografia-homofonas-3',
          title: 'Vaya/Valla',
          description: 'Practica el uso correcto de vaya y valla.',
          objective: 'Diferenciar y usar correctamente vaya y valla.',
          content: 'Vaya a la valla. Que vaya bien. La valla es alta. ¡Vaya sorpresa!',
          focusKeys: ['v', 'a', 'l', 'b'],
          reviewKeys: ['e', 'i', 'o', 'u', 'r', 's', 'n'],
          allowed: `VayaalavallaQuévayabienLavallaesaltaVayasorpresa${SPACE}`,
          order: 54,
        }),
        practice({
          slug: 'ortografia-porque-1',
          title: 'Porque/Por qué/Porqué/Por que',
          description: 'Practica los usos de porque, por qué, porqué y por que.',
          objective: 'Usar correctamente las cuatro variantes de porque.',
          content:
            'Porque estudié. ¿Por qué llegas tarde? No entiendo el porqué. Lucha por que gane.',
          focusKeys: ['p', 'o', 'r', 'q', 'e', 'u', 'c'],
          reviewKeys: ['a', 'i', 's', 't', 'n', 'd', 'l'],
          allowed: `PorqueestudiéPorquéllegastardeNoentiendoelporquéLuchaporquegane¿?${SPACE}`,
          order: 55,
        }),
        practice({
          slug: 'ortografia-porque-2',
          title: 'Porque/Por qu - Más Ejemplos',
          description: 'Más práctica con las variantes de porque.',
          objective: 'Reforzar el uso correcto de porque, por qué, porqué y por que.',
          content: 'No sé por qué llegaste tarde. Porque perdí el autobús. El porqué del retraso fue el tráfico. Trabajó por que el proyecto saliera bien.',
          focusKeys: ['p', 'o', 'r', 'q', 'e', 'u'],
          reviewKeys: ['a', 'i', 's', 't', 'n', 'd', 'l', 'c'],
          allowed: `NoséporquéPorqueesasíElporquédetodoPorqueasísea¿?${SPACE}`,
          order: 56,
        }),
        practice({
          slug: 'ortografia-sino-sino-1',
          title: 'Sino/Si no',
          description: 'Practica el uso correcto de sino y si no.',
          objective: 'Diferenciar y usar correctamente sino y si no.',
          content:
            'No es uno, sino dos. Si no vienes, me voy. No quiero té, sino café. Si no llegas, avisa.',
          focusKeys: ['s', 'i', 'n', 'o'],
          reviewKeys: ['a', 'e', 'u', 'r', 'l', 'p', 'v', 'm'],
          allowed: `NoesunosinodosSinovienesmevoyNoquierosinopazSinonllegasavisa${SPACE}`,
          order: 57,
        }),
        practice({
          slug: 'ortografia-homofonas-avanzado',
          title: 'Homófonas Avanzadas',
          description: 'Practica otras palabras homófonas comunes.',
          objective: 'Usar correctamente diversas palabras homófonas.',
          content:
            'Vaya a la valla. Echo de menos el eco. Hecho en casa. Graba el video en la grava.',
          focusKeys: ['v', 'e', 'c', 'g', 'h'],
          reviewKeys: ['a', 'i', 'o', 'u', 'r', 'l', 's', 'n', 'd'],
          allowed: `VayaalavallaEchodemenoselhechoHechoencasaGrabaelvideoenlagrava${SPACE}`,
          order: 58,
        }),
        practice({
          slug: 'ortografia-homofonas-avanzado-2',
          title: 'Homófonas Avanzadas - Más Ejemplos',
          description: 'Más palabras homófonas para practicar.',
          objective: 'Dominar el uso de diversas palabras homófonas.',
          content: 'Hola, ola grande. A ver, haber si viene. Hierba, hierva, tu y tú.',
          focusKeys: ['h', 'o', 'a', 'v', 'e', 'r', 'b', 't', 'u'],
          reviewKeys: ['i', 's', 'n', 'd', 'l', 'p', 'c'],
          allowed: `HolaolagrandeAverhabersivieneHierbahiervatuyty${SPACE}`,
          order: 59,
        }),
      ],
    },
    {
      slug: 'ortografia-avanzada',
      title: 'Ortografía Avanzada',
      description: 'Palabras compuestas, extranjerismos y repaso general.',
      order: 5,
      lessons: [
        introduction({
          slug: 'ortografia-compuestas-intro',
          title: 'Palabras Compuestas - Introducción',
          description: 'Reglas de palabras compuestas.',
          objective: 'Comprender la formación de palabras compuestas.',
          content:
            'Las palabras compuestas se forman uniendo dos o más palabras. La tilde se aplica según las reglas generales. En algunos casos se mantiene el significado de las palabras originales.',
          targetKeys: ['Compuestas'],
          order: 60,
        }),
        practice({
          slug: 'ortografia-compuestas-1',
          title: 'Palabras Compuestas - Parte 1',
          description: 'Practica palabras compuestas.',
          objective: 'Escribir correctamente palabras compuestas.',
          content: 'paraguas abrelatas cortaúñas sacacorchos limpiabotas portaviones',
          focusKeys: ['p', 'a', 'r', 'c', 't', 's', 'l', 'b', 'v'],
          reviewKeys: ['e', 'i', 'o', 'u', 'n', 'd', 'm', 'ñ'],
          allowed: `paraguasabrelatascortaañassacacorchoslimpiabotasportaviones${SPACE}`,
          order: 61,
        }),
        practice({
          slug: 'ortografia-compuestas-2',
          title: 'Palabras Compuestas - Parte 2',
          description: 'Más palabras compuestas para practicar.',
          objective: 'Reforzar la escritura de palabras compuestas.',
          content: 'guardarropa rompecabezas paracaídas lanzallamas parasol',
          focusKeys: ['p', 'r', 'c', 'l', 's', 'b', 'a', 'd'],
          reviewKeys: ['e', 'i', 'o', 'u', 'n', 'm', 'ñ'],
          allowed: `guardarroparompecabezasparacaídaslanzallamasparasol${SPACE}`,
          order: 62,
        }),
        practice({
          slug: 'ortografia-compuestas-tilde',
          title: 'Palabras Compuestas con Tilde',
          description: 'Practica palabras compuestas con tilde.',
          objective: 'Usar tildes correctamente en palabras compuestas.',
          content: 'décimotercero vigésimoquinto cortafuegos rascacielos baloncesto',
          focusKeys: ['d', 'e', 'c', 'r', 't', 's', 'l', 'b'],
          reviewKeys: ['a', 'i', 'o', 'u', 'n', 'm', 'ñ'],
          allowed: `décimotercerovigésimoquintocortafuegosrascacielosbaloncesto${SPACE}`,
          order: 63,
        }),
        introduction({
          slug: 'ortografia-extranjerismos-intro',
          title: 'Extranjerismos - Introducción',
          description: 'Adaptación de palabras extranjeras.',
          objective: 'Identificar extranjerismos y sus adaptaciones.',
          content:
            'Los extranjerismos se adaptan al español respetando la pronunciación. Ejemplos: fútbol, béisbol, cóctel, líder. Algunos mantienen su escritura original.',
          targetKeys: ['Extranjerismos'],
          order: 64,
        }),
        practice({
          slug: 'ortografia-extranjerismos-1',
          title: 'Extranjerismos Adaptados - Parte 1',
          description: 'Practica extranjerismos comúnmente usados.',
          objective: 'Escribir correctamente extranjerismos adaptados.',
          content: 'fútbol béisbol cóctel líder chef jazz chip tique yogur',
          focusKeys: ['f', 'b', 'c', 'l', 'j', 't', 'y'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 'r', 's', 'n', 'd'],
          allowed: `fútbolbéisbolcóctellíderchefjazzchiptiqueyogur${SPACE}`,
          order: 65,
        }),
        practice({
          slug: 'ortografia-extranjerismos-2',
          title: 'Extranjerismos Adaptados - Parte 2',
          description: 'Más extranjerismos para practicar.',
          objective: 'Reconocer y escribir extranjerismos correctamente.',
          content: 'ballet clóset eslogan estándar gélido internet píxel rugby',
          focusKeys: ['b', 'c', 'e', 'g', 'i', 'p', 'r'],
          reviewKeys: ['a', 'o', 'u', 's', 'n', 'd', 'l', 't'],
          allowed: `balletclósetesloganestándargélidointernetpíxelrugby${SPACE}`,
          order: 66,
        }),
        practice({
          slug: 'ortografia-extranjerismos-3',
          title: 'Extranjerismos No Adaptados',
          description: 'Practica extranjerismos que mantienen su escritura.',
          objective: 'Reconocer y escribir extranjerismos no adaptados.',
          content: 'hardware software feedback marketing benchmark manager',
          focusKeys: ['h', 's', 'f', 'm', 'b', 'a', 'd', 'r'],
          reviewKeys: ['e', 'i', 'o', 'u', 'l', 'n', 't', 'c'],
          allowed: `hardwaresoftwarefeedbackmarketingbenchmarkmanager${SPACE}`,
          order: 67,
        }),
        practice({
          slug: 'ortografia-repaso-general-1',
          title: 'Repaso General - Parte 1',
          description: 'Repaso de todas las reglas ortográficas.',
          objective: 'Aplicar todas las reglas ortográficas estudiadas.',
          content: 'El coche azul de Juan no funciona. ¿Por qué llegas tarde? ¡Qué alegría!',
          focusKeys: ['e', 'l', 'c', 'a', 'j', 'p', 't', 'q'],
          reviewKeys: ['o', 'r', 's', 'n', 'd', 'm', 'b', 'v'],
          allowed: `ElcocheazuldeJuannofuncionaPorquéllegastardeQuéalegría¿¡?!${SPACE}`,
          order: 68,
        }),
        practice({
          slug: 'ortografia-repaso-general-2',
          title: 'Repaso General - Parte 2',
          description: 'Repaso completo de todas las reglas.',
          objective: 'Demostrar dominio de la ortografía española.',
          content: 'México es un país hermoso. Había una vez un pájaro cantando. Voy a ver el mar.',
          focusKeys: ['m', 'p', 'h', 'v', 'c', 'j', 'a', 'e'],
          reviewKeys: ['o', 'r', 's', 't', 'n', 'd', 'l', 'u', 'i'],
          allowed: `MéxicoesunpaíshermosoHabíaunavezunpájarocantandoVoyaverelmar${SPACE}`,
          order: 69,
        }),
        practice({
          slug: 'ortografia-repaso-general-3',
          title: 'Repaso General - Parte 3',
          description: 'Dictado final de ortografía.',
          objective: 'Aplicar todo lo aprendido en un dictado completo.',
          content:
            'El jardín tiene flores y árboles. La luna brillaba en el cielo. Los niños juegan contentos.',
          focusKeys: ['j', 'f', 'l', 'c', 'n', 't', 'a', 'e'],
          reviewKeys: ['o', 'r', 's', 'd', 'm', 'b', 'v', 'g', 'p'],
          allowed: `EljardíntienefloresyárbolesLalunabrillabaenelcieloLosniñosjuegancontentos${SPACE}`,
          order: 70,
        }),
        practice({
          slug: 'ortografia-repaso-general-4',
          title: 'Repaso General - Parte 4',
          description: 'Repaso con palabras difíciles.',
          objective: 'Aplicar reglas ortográficas en palabras complejas.',
          content: 'Excepcionalmente, el búho voló sobre el exagerado jardín. ¡Qué maravilla!',
          focusKeys: ['e', 'b', 'v', 'j', 'm', 'x', 'g'],
          reviewKeys: ['a', 'i', 'o', 'u', 'r', 's', 'l', 'n', 'd', 'p', 'c', 't'],
          allowed: `ExcepcionalmenteelbúhovolosobreeljardínQuemaravilla¿¡?!${SPACE}`,
          order: 71,
        }),
        practice({
          slug: 'ortografia-repaso-general-5',
          title: 'Repaso General - Parte 5',
          description: 'Dictado final con todas las reglas.',
          objective: 'Demostrar dominio completo de la ortografía española.',
          content:
            'Había una vez un jardín lleno de rosas. El dueño, muy contento, regaba las flores. ¿Quieres venir a verlas?',
          focusKeys: ['h', 'j', 'r', 'd', 'c', 'f', 'v', 'q'],
          reviewKeys: ['a', 'e', 'i', 'o', 'u', 's', 'n', 'l', 'p', 't', 'm', 'b', 'g'],
          allowed: `HabíaunavezunjardínllenoderosasEldueñomuycontentoregalabafloresQuieresveniraverlas¿?!${SPACE}`,
          order: 72,
        }),
      ],
    },
  ],
};

const audioBasePath = '/audio/es/ortografia';

const lessonUpdates = {
  'ortografia-mayusculas-intro': {
    title: 'Antes de empezar: mayúsculas',
    content:
      'En este curso aprenderás una regla, verás ejemplos y después practicarás escribiéndolos. Usa mayúscula al comenzar una oración y en nombres propios, como personas, lugares e instituciones. Los días de la semana y los meses se escriben con minúscula, salvo al inicio de una oración.',
  },
  'ortografia-acentuacion-intro': {
    title: 'Cómo decidir si una palabra lleva tilde',
    content:
      'Primero identifica la sílaba que suena con más fuerza. Las agudas llevan tilde si terminan en vocal, n o s; las graves la llevan si terminan en una consonante distinta de n o s; y las esdrújulas siempre llevan tilde. La tilde cambia la escritura, no es un adorno.',
  },
  'ortografia-b-v-intro': {
    title: 'B y V: busca pistas, no adivines',
    content:
      'No existe una regla para todas las palabras con b y v, pero sí hay pistas útiles. Se escriben con b los verbos terminados en -bir, excepto hervir, servir y vivir, y las terminaciones del pretérito imperfecto en -aba. Se escriben con v las formas de venir y vivir. Practica primero palabras frecuentes.',
  },
  'ortografia-c-s-z-intro': {
    title: 'C, S y Z',
    content:
      'La letra c se escribe antes de las vocales e y i en muchas palabras, como cena y cielo, y la z antes de a, o y u, como zapato y zumo. En gran parte de América, c, s y z pueden sonar igual; por eso conviene aprender familias de palabras y consultar una duda, en vez de confiar solo en el sonido.',
  },
  'ortografia-g-j-intro': {
    title: 'G y J',
    content:
      'Antes de e y de i, la g y la j pueden representar sonidos parecidos. Muchas palabras terminadas en -aje se escriben con j, como viaje. Muchos verbos terminados en -ger y -gir se escriben con g, como escoger y dirigir, aunque sus formas con sonido de j cambian: escojo y dirijo.',
  },
  'ortografia-h-intro': {
    title: 'H: una letra que no se oye',
    content:
      'La h no tiene sonido, así que hay que reconocer las palabras que la llevan. Aparece en haber, hacer y hablar; también en muchas palabras que empiezan por hie-, hue- y hum-. No inventes una h: aprende cada familia de palabras con ejemplos claros.',
  },
  'ortografia-ll-y-intro': {
    title: 'LL y Y',
    content:
      'En muchas regiones ll y y suenan igual, pero se escriben distinto. La terminación -illo o -illa suele llevar ll, como botella y silla. La y se usa como palabra que une ideas, por ejemplo pan y leche, y al final de palabras como hoy y rey.',
  },
  'ortografia-r-rr-intro': {
    title: 'R y RR',
    content:
      'Al inicio de una palabra se escribe una sola r, aunque suene fuerte: ratón. Entre vocales, usa rr para el sonido fuerte, como en perro, y una r para el sonido suave, como en pero. Después de n, l o s, una sola r también suena fuerte: alrededor, honrado, Israel.',
  },
  'ortografia-x-intro': {
    title: 'X en palabras frecuentes',
    content:
      'La x aparece en palabras como examen, texto y explicación. El prefijo ex- significa antes o fuera en expresiones como exalumno. Como la x puede representar sonidos distintos, conviene memorizar las palabras frecuentes y revisar las que generen duda.',
  },
  'ortografia-puntuacion-intro': {
    title: 'La puntuación hace claro el mensaje',
    content:
      'Puntuar no es decorar un texto: ayuda a que se entienda. El punto cierra una idea; la coma separa elementos o marca pausas necesarias; los signos de interrogación y exclamación se abren y se cierran en español. Lee cada ejemplo en voz baja para notar la pausa y la intención.',
  },
  'ortografia-homofonas-intro': {
    title: 'Palabras que suenan igual',
    content:
      'Algunas palabras suenan igual o muy parecido, pero se escriben diferente porque significan cosas distintas. Hay indica existencia, ahí señala un lugar y ay expresa dolor o sorpresa. Para elegir bien, lee la oración completa y pregunta qué quiere decir.',
  },
  'ortografia-compuestas-intro': {
    title: 'Palabras compuestas',
    content:
      'Una palabra compuesta une dos palabras, como paraguas o sacacorchos. Si se escribe en una sola palabra, sigue las reglas generales de acentuación. No todas conservan la tilde que tenían por separado: décimo y tercero forman decimotercero.',
  },
  'ortografia-extranjerismos-intro': {
    title: 'Palabras de otros idiomas',
    content:
      'Cuando una palabra extranjera ya tiene una forma adaptada al español, es preferible usarla: fútbol, líder, píxel o tique. Las voces extranjeras no adaptadas suelen escribirse en cursiva en textos formales. En este curso practicarás formas frecuentes y recomendadas.',
  },
  'ortografia-porque-2': {
    title: 'Porque, por qué, porqué y por que: repaso',
    content: 'No sé por qué llegaste tarde. Porque perdí el autobús. El porqué del retraso fue el tráfico. Trabajó por que el proyecto saliera bien.',
  },
  'ortografia-homofonas-avanzado': {
    content: 'Echo de menos a mi amiga. El hecho ocurrió ayer. Graba el video sobre la grava.',
  },
  'ortografia-homofonas-avanzado-2': {
    content: 'Hola, ola grande. A ver si viene. Debe de haber tráfico. Tu cuaderno está aquí. Tú tienes razón.',
  },
};

for (const moduleData of course.modules) {
  for (const lesson of moduleData.lessons) {
    if (lessonUpdates[lesson.slug]) Object.assign(lesson, lessonUpdates[lesson.slug]);
    if (lesson.type === 'practice') lesson.allowedCharacters = characters(lesson.content);
  }
}

function addIntroduction(moduleSlug, beforeSlug, lesson) {
  const moduleData = course.modules.find((item) => item.slug === moduleSlug);
  const index = moduleData.lessons.findIndex((item) => item.slug === beforeSlug);
  moduleData.lessons.splice(index, 0, introduction(lesson));
}

addIntroduction('signos-puntuacion', 'ortografia-punto-coma-1', {
  slug: 'ortografia-punto-y-coma-intro',
  title: 'Punto y coma: pausas con intención',
  description: 'Aprende a cerrar ideas y separar elementos con claridad.',
  objective: 'Distinguir el uso básico del punto y la coma.',
  content: 'El punto termina una oración completa. La coma separa elementos de una lista y puede aislar una aclaración. No pongas coma entre el sujeto y el verbo: Mi hermana, cocina no es correcto.',
  targetKeys: ['.', ','],
});

addIntroduction('signos-puntuacion', 'ortografia-dos-puntos-1', {
  slug: 'ortografia-dos-puntos-y-comillas-intro',
  title: 'Dos puntos y comillas',
  description: 'Presenta listas, explicaciones y palabras textuales.',
  objective: 'Usar dos puntos y comillas en casos cotidianos.',
  content: 'Usa dos puntos para anunciar una lista o una explicación: Necesito tres cosas: pan, leche y fruta. Las comillas encierran palabras textuales o títulos breves. Coloca el signo de puntuación donde corresponda a la oración.',
  targetKeys: [':', '"'],
});

addIntroduction('signos-puntuacion', 'ortografia-exclamacion-interrogacion-1', {
  slug: 'ortografia-interrogacion-y-exclamacion-intro',
  title: 'Preguntas y exclamaciones',
  description: 'Usa los signos de apertura y cierre del español.',
  objective: 'Escribir preguntas y exclamaciones completas.',
  content: 'En español, las preguntas llevan ¿ al inicio y ? al final. Las exclamaciones llevan ¡ y !. Escribe ambos signos, incluso si la pregunta o la exclamación ocupa solo una parte de la oración.',
  targetKeys: ['¿', '?', '¡', '!'],
});

addIntroduction('palabras-homofonas', 'ortografia-porque-1', {
  slug: 'ortografia-porque-intro',
  title: 'Porque, por qué, porqué y por que',
  description: 'Distingue las cuatro formas según lo que expresa la oración.',
  objective: 'Elegir la forma correcta en frases frecuentes.',
  content: 'Usa por qué en preguntas: ¿Por qué llegas tarde? Usa porque para responder: Porque perdí el autobús. El porqué es un sustantivo y significa motivo. Por que aparece en casos menos frecuentes, como Trabajó por que el proyecto saliera bien.',
  targetKeys: ['porque'],
});

addIntroduction('palabras-homofonas', 'ortografia-sino-sino-1', {
  slug: 'ortografia-sino-si-no-intro',
  title: 'Sino y si no',
  description: 'Separa una condición de una oposición.',
  objective: 'Diferenciar sino de si no.',
  content: 'Sino contrapone una idea con otra: No quiero té, sino café. Si no expresa una condición: Si no estudias, será más difícil. Una pista: si puedes añadir entonces, normalmente se escribe separado.',
  targetKeys: ['sino'],
});

course.modules[0].title = 'Escribir con claridad';
course.modules[0].description = 'Mayúsculas y tildes para construir una base segura.';
course.modules[1].title = 'Letras que generan dudas';
course.modules[1].description = 'Pistas y práctica para B/V, C/S/Z, G/J, H, LL/Y, R/RR y X.';
course.modules[2].title = 'Puntuación que guía la lectura';
course.modules[2].description = 'Signos para ordenar las ideas y expresar intención.';
course.modules[3].title = 'Palabras que se confunden';
course.modules[3].description = 'Homófonas y expresiones frecuentes vistas en contexto.';
course.modules[4].title = 'Escritura cotidiana y repaso';
course.modules[4].description = 'Palabras compuestas, préstamos adaptados y práctica integradora.';

let order = 1;
for (const [moduleIndex, moduleData] of course.modules.entries()) {
  moduleData.order = moduleIndex + 1;
  for (const lesson of moduleData.lessons) {
    lesson.order = order;
    lesson.audioUrl = lesson.type === 'explanatory'
      ? `${audioBasePath}/lesson-${order}-es.mp3`
      : null;
    order += 1;
  }
}

course.curriculumVersion = 2;
course.estimatedMinutes = 270;

module.exports = course;
