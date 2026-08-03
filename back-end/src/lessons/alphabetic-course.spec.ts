const alphabeticCourse = require('../../scripts/db/curriculum/es/alphabetic-course');
const orthographyCourse = require('../../scripts/db/curriculum/es/curso-ortografia');
const englishFoundationsCourse = require('../../scripts/db/curriculum/en/english-a1-a2-course');
const { validateCourse } = require('../../scripts/db/curriculum/alphabetic-validator');

type Lesson = {
  slug: string;
  order: number;
  type: 'practice' | 'explanatory';
  focusKeys: string[];
  reviewKeys: string[];
  audioUrl: string | null;
  mediaUrl: string | null;
};
type Course = {
  slug: string;
  languageCode: string;
  modules: Array<{ slug: string; order: number; lessons: Lesson[] }>;
};

const alphabetic: Course = alphabeticCourse as Course;
const orthography: Course = orthographyCourse as Course;
const englishFoundations: Course = englishFoundationsCourse as Course;

describe('curriculos de cursos en espanol', () => {
  const alphabeticLessons = alphabetic.modules.flatMap((moduleData) => moduleData.lessons);
  const orthographyLessons = orthography.modules.flatMap((moduleData) => moduleData.lessons);
  const englishFoundationsLessons = englishFoundations.modules.flatMap(
    (moduleData) => moduleData.lessons,
  );

  it('mantiene valido el curso alfabetico actual', () => {
    expect(() => validateCourse(alphabeticCourse)).not.toThrow();
    expect(alphabetic.modules).toHaveLength(6);
    expect(alphabeticLessons).toHaveLength(75);
    expect(alphabetic.modules.map((moduleData) => moduleData.slug)).toEqual([
      'fila-descanso',
      'fila-superior',
      'fila-inferior',
      'fila-numerica',
      'mayusculas-y-acentos',
      'escritura-cotidiana',
    ]);
    expect(alphabetic.modules.map((moduleData) => moduleData.lessons.length)).toEqual([
      21, 15, 15, 15, 7, 2,
    ]);
    expect(new Set(alphabeticLessons.map((lesson) => lesson.slug)).size).toBe(75);
    expect(alphabeticLessons.map((lesson) => lesson.order)).toEqual(
      Array.from({ length: 75 }, (_, index) => index + 1),
    );
    for (const lesson of alphabeticLessons) {
      expect(new Set(lesson.focusKeys).size).toBe(lesson.focusKeys.length);
      expect(new Set(lesson.reviewKeys).size).toBe(lesson.reviewKeys.length);
    }
  });

  it('mantiene los audios contractuales de posición de descanso y G/H', () => {
    const restLesson = alphabeticLessons.find(
      (item) => item.order === 9 && item.slug === 'posicion-descanso',
    );
    const lesson = alphabeticLessons.find((item) => item.order === 10 && item.slug === 'g-h-guia');

    expect(restLesson).toMatchObject({
      type: 'explanatory',
      audioUrl: '/audio/es/caracteres-alfabeticos/lesson-9-es.mp3',
    });
    expect(lesson).toMatchObject({
      type: 'explanatory',
      audioUrl: '/audio/es/caracteres-alfabeticos/lesson-10-es.mp3',
    });
  });

  it('incluye refuerzo de Shift, tildes y diéresis al final', () => {
    expect(alphabeticLessons.slice(-7).map((lesson) => lesson.slug)).toEqual([
      'shift-practica-refuerzo',
      'acento-agudo-introduccion',
      'vocales-con-tilde',
      'dieresis-introduccion',
      'palabras-con-dieresis',
      'teclas-de-uso-diario',
      'practica-final-integradora',
    ]);
    expect(alphabeticLessons.slice(-7).map((lesson) => lesson.audioUrl)).toEqual([
      null,
      '/audio/es/caracteres-alfabeticos/lesson-70-es.mp3',
      '/audio/es/caracteres-alfabeticos/lesson-71-es.mp3',
      '/audio/es/caracteres-alfabeticos/lesson-72-es.mp3',
      '/audio/es/caracteres-alfabeticos/lesson-73-es.mp3',
      '/audio/es/caracteres-alfabeticos/lesson-74-es.mp3',
      '/audio/es/caracteres-alfabeticos/lesson-75-es.mp3',
    ]);
  });

  it('mantiene valido el curso de ortografia actual', () => {
    expect(() => validateCourse(orthographyCourse)).not.toThrow();
    expect(orthography.languageCode).toBe('es');
    expect(orthography.slug).toBe('curso-ortografia-es');
    expect(orthography.modules.map((moduleData) => moduleData.slug)).toEqual([
      'fundamentos-basicos',
      'uso-de-letras',
      'signos-puntuacion',
      'palabras-homofonas',
      'ortografia-avanzada',
    ]);
    expect(orthography.modules.map((moduleData) => moduleData.lessons.length)).toEqual([
      12, 27, 14, 11, 13,
    ]);
    expect(orthographyLessons).toHaveLength(77);
    expect(orthographyLessons.map((lesson) => lesson.order)).toEqual(
      Array.from({ length: 77 }, (_, index) => index + 1),
    );

    const audioLessons = orthographyLessons.filter((lesson) => lesson.audioUrl);
    expect(audioLessons.map((lesson) => lesson.order)).toEqual([
      1, 5, 13, 17, 21, 25, 29, 33, 37, 40, 41, 45, 48, 54, 58, 61, 65, 69,
    ]);
    for (const lesson of audioLessons) {
      expect(lesson).toMatchObject({
        type: 'explanatory',
        audioUrl: `/audio/es/ortografia/lesson-${lesson.order}-es.mp3`,
      });
    }
  });

  it('mantiene una primera ruta de ingles A1 y A2', () => {
    expect(() => validateCourse(englishFoundationsCourse)).not.toThrow();
    expect(englishFoundations).toMatchObject({
      slug: 'english-foundations-a1-a2',
      languageCode: 'es',
    });
    expect(englishFoundations.modules.map((moduleData) => moduleData.slug)).toEqual(['a1-saludos']);
    expect(englishFoundations.modules.map((moduleData) => moduleData.lessons.length)).toEqual([15]);
    expect(englishFoundationsLessons).toHaveLength(15);
    expect(englishFoundationsLessons.map((lesson) => lesson.order)).toEqual(
      Array.from({ length: 15 }, (_, index) => index + 1),
    );
    expect(
      englishFoundationsLessons.filter((lesson) => lesson.type === 'explanatory'),
    ).toHaveLength(13);
    expect(englishFoundationsLessons.map((lesson) => lesson.mediaUrl)).toEqual([
      'listening',
      'matching',
      null,
      'dialogue',
      'fill-blank',
      'type-choice',
      'correct-word',
      'correct-sentence',
      'word-order',
      'word-build',
      'listen-choice',
      'dictation',
      'dialogue-choice',
      'branching-dialogue',
      'mini-review',
    ]);
    expect(englishFoundationsLessons[0]).toMatchObject({
      type: 'explanatory',
      mediaUrl: 'listening',
    });
    expect(englishFoundationsLessons[1]).toMatchObject({
      mediaUrl: 'matching',
      targetKeys: ['hello|hola', 'good morning|buenos días'],
    });
    expect(englishFoundationsLessons[2]).toMatchObject({
      type: 'practice',
      mediaUrl: null,
      audioUrl: null,
    });
    expect(englishFoundationsLessons[3]).toMatchObject({
      type: 'practice',
      mediaUrl: 'dialogue',
    });
    expect(
      englishFoundationsLessons.filter((lesson) => lesson.audioUrl).map((lesson) => lesson.order),
    ).toEqual([1, 4, 11, 12, 13, 14]);
    for (const lesson of englishFoundationsLessons.filter((item) => item.order <= 4 && item.audioUrl)) {
      expect(lesson.audioUrl).toBe(
        `/audio/es/english-foundations-a1-a2/lesson-${lesson.order}-en.mp3`,
      );
    }
    for (const lesson of englishFoundationsLessons.filter((item) => item.order > 4 && item.audioUrl)) {
      expect(lesson.audioUrl).toBe(
        `/audio/en/english-foundations-a1-a2/lesson-${lesson.order}-en.mp3`,
      );
    }
  });
});
