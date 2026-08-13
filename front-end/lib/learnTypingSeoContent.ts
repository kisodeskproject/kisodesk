import type { Locale } from './locales';

export type LearnTypingFaqItem = { question: string; answer: string };

export type LearnTypingSeoContent = {
  title: string;
  metaDescription: string;
  intro: string;
  whatIsIt: string;
  whyItMatters: string;
  steps: string[];
  commonMistakes: string;
  tips: string;
  faq: LearnTypingFaqItem[];
  labels: {
    whatIsItTitle: string;
    whyItMattersTitle: string;
    stepsTitle: string;
    commonMistakesTitle: string;
    tipsTitle: string;
    faqTitle: string;
    ctaLabel: string;
  };
};

// Visible, server-rendered explanatory copy for the "learn touch typing"
// landing page. Only locales with real, reviewed native content belong here.
// A locale without an entry is treated as not published yet: the page must
// render noindex and stay out of the sitemap for that locale rather than
// falling back to a machine-translated placeholder.
export const LEARN_TYPING_SEO_CONTENT: Readonly<Partial<Record<Locale, LearnTypingSeoContent>>> = {
  'es-latam': {
    title: 'Aprender mecanografía desde cero',
    metaDescription:
      'Aprende a escribir en el teclado sin mirarlo, con la técnica correcta desde el primer día. Guía práctica y curso guiado gratuito en KisoDesk.',
    intro:
      'Aprender mecanografía significa escribir usando los diez dedos sin mirar el teclado. En inglés se conoce como touch typing. No se trata solo de escribir rápido: es una técnica que, cuando la aprendes bien, te permite escribir con más comodidad, menos errores y menos cansancio en las manos y las muñecas.',
    whatIsIt:
      'La técnica se basa en la fila guía (asdf jklñ), donde descansan tus dedos entre una pulsación y otra. Cada tecla se pulsa con un dedo específico, y el objetivo es memorizar la posición de cada tecla hasta poder escribir sin pensar en dónde está cada letra.',
    whyItMatters:
      'Escribir sin mirar el teclado te permite concentrarte en lo que estás escribiendo en lugar de pensar en dónde está cada tecla. A largo plazo, mejora tu velocidad, reduce los errores al buscar las teclas y hace que escribir durante períodos prolongados sea más cómodo.',
    steps: [
      'Ubica la fila guía y aprende la posición de descanso de cada dedo.',
      'Practica la fila guía hasta escribirla sin mirar el teclado.',
      'Incorpora la fila superior y la fila inferior, volviendo siempre a la posición de descanso.',
      'Incorpora los números y los signos de puntuación.',
      'Practica con palabras y textos completos hasta ganar fluidez.',
    ],
    commonMistakes:
      'Los errores más comunes al empezar son mirar el teclado en vez de la pantalla, usar siempre los mismos dedos para todas las teclas, y priorizar la velocidad antes de dominar la técnica. Corregir esto desde el principio evita tener que desaprender malos hábitos más adelante.',
    tips:
      'Practica en sesiones cortas pero frecuentes en vez de una sola sesión larga. Prioriza escribir sin errores en lugar de escribir rápido: la velocidad llega naturalmente cuando la técnica es correcta. Repite los ejercicios en las teclas donde más te equivocas, en vez de repetir siempre lo mismo.',
    faq: [
      {
        question: '¿Cuánto tiempo toma aprender mecanografía?',
        answer:
          'Depende de la práctica, pero con sesiones cortas y regulares es habitual notar mejoras claras en pocas semanas. Dominar la técnica por completo, sin tener que mirar el teclado, suele tomar más tiempo y depende de cuánto practiques.',
      },
      {
        question: '¿Mecanografía es lo mismo que escribir rápido?',
        answer:
          'No. Escribir rápido sin técnica suele generar errores y cansancio. La mecanografía consiste en usar cada dedo para determinadas teclas y escribir sin mirar el teclado; la velocidad es una consecuencia de practicar esa técnica, no el punto de partida.',
      },
      {
        question: '¿Necesito un teclado especial para aprender?',
        answer:
          'No. Puedes aprender con cualquier teclado físico. Lo que sí es importante es practicar con la distribución que realmente usas, ya que puede cambiar según el idioma y la región.',
      },
      {
        question: '¿Sirve para cualquier idioma o distribución de teclado?',
        answer:
          'Sí. La técnica de base es la misma, pero cada idioma tiene sus propios caracteres, signos y combinaciones de letras, por eso practicar con contenido en tu idioma ayuda más que practicar con texto genérico.',
      },
      {
        question: '¿Aprender mecanografía en KisoDesk tiene costo?',
        answer:
          'No. El curso guiado y la práctica están disponibles sin costo y sin necesidad de crear una cuenta para empezar.',
      },
    ],
    labels: {
      whatIsItTitle: '¿En qué consiste la técnica?',
      whyItMattersTitle: 'Por qué importa',
      stepsTitle: 'Cómo empezar',
      commonMistakesTitle: 'Errores comunes',
      tipsTitle: 'Consejos de práctica',
      faqTitle: 'Preguntas frecuentes',
      ctaLabel: 'Empezar el curso guiado',
    },
  },
};
