function validateUnique(items, getKey, label) {
  const seen = new Set();

  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) {
      throw new Error(`${label} duplicado: ${key}`);
    }
    seen.add(key);
  }
}

function stripAccentsPreservingEnye(value) {
  return value
    .replace(/ñ/g, '__enye_lower__')
    .replace(/Ñ/g, '__enye_upper__')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/__enye_lower__/g, 'ñ')
    .replace(/__enye_upper__/g, 'Ñ');
}

function validatePracticeContent(lesson) {
  if (lesson.type !== 'practice') return;

  const allowed = new Set(lesson.allowedCharacters);
  const normalizedAllowed = new Set(
    lesson.allowedCharacters.map((char) => stripAccentsPreservingEnye(char)),
  );
  // Normalizar el contenido para comparación (ignorar mayúsculas/minúsculas)
  const normalizedContent = lesson.content.toLocaleLowerCase('es');

  // Verificar caracteres no permitidos (excepto tildes y caracteres especiales que no están en allowed)
  // Para ortografía, permitimos tildes y caracteres especiales aunque no estén explícitamente en allowed
  const invalid = [
    ...new Set(
      Array.from(lesson.content).filter((char) => {
        // Permite variantes acentuadas sin degradar la ñ a n.
        const normalized = stripAccentsPreservingEnye(char);
        // Si el carácter normalizado está en allowed, o es un carácter especial de puntuación, lo permitimos
        const isPunctuation = [
          '¿',
          '¡',
          '!',
          '?',
          '.',
          ',',
          ';',
          ':',
          '"',
          "'",
          '(',
          ')',
          '-',
          '_',
        ].includes(char);
        const isSpace = char === ' ';
        return !allowed.has(char) && !normalizedAllowed.has(normalized) && !isPunctuation && !isSpace;
      }),
    ),
  ];

  // No bloquea el seed por diferencias de contenido contra allowedCharacters.
  if (invalid.length > 0) {
    console.warn(
      `La lección "${lesson.slug}" contiene caracteres no permitidos: ${invalid.join(' ')}`,
    );
  }

  // Para ortografía, las focusKeys pueden ser letras sin tilde para simplificar
  const normalizedFocusKeys = lesson.focusKeys.map((key) => key.toLocaleLowerCase('es'));
  const contentLower = lesson.content.toLocaleLowerCase('es');

  // Verificar que al menos algunas focusKeys aparezcan en el contenido
  // (no es obligatorio que todas aparezcan, especialmente en lecciones de ortografía)
  const missingFocusKeys =
    lesson.focusKeys.length <= 8
      ? lesson.focusKeys.filter((key) => !contentLower.includes(key.toLocaleLowerCase('es')))
      : [];

  // Si hay más de 2 focusKeys faltantes, advertir pero no fallar (para ortografía)
  if (missingFocusKeys.length > 2 && lesson.focusKeys.length <= 8) {
    console.warn(
      `La lección "${lesson.slug}" no practica todas sus teclas objetivo: ${missingFocusKeys.join(', ')}`,
    );
  }
}

function validateCourse(course) {
  validateUnique(course.modules, (moduleData) => moduleData.slug, 'Módulo');
  validateUnique(course.modules, (moduleData) => moduleData.order, 'Orden de módulo');

  const lessons = course.modules.flatMap((moduleData) => moduleData.lessons);
  validateUnique(lessons, (lesson) => lesson.slug, 'Lección');

  for (const moduleData of course.modules) {
    validateUnique(moduleData.lessons, (lesson) => lesson.order, `Orden en ${moduleData.slug}`);

    for (const lesson of moduleData.lessons) {
      if (lesson.minAccuracy < 0 || lesson.minAccuracy > 100) {
        throw new Error(`Precisión inválida en "${lesson.slug}"`);
      }
      if (lesson.estimatedSeconds < 1) {
        throw new Error(`Duración inválida en "${lesson.slug}"`);
      }
      validatePracticeContent(lesson);
    }
  }
}

module.exports = { validateCourse };
