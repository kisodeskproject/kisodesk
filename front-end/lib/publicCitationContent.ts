import type { Locale } from './locales';

type PracticeQuestions = {
  measures: string;
  metrics: string;
  start: string;
  results: string;
  improve: string;
};

type CourseQuestions = {
  typingVsSpelling: string;
  beginners: string;
  language: string;
  typingVsSpellingAnswer: string;
  beginnersAnswer: string;
  languageAnswer: string;
  showGuidance: string;
  hideGuidance: string;
};

type LessonLabels = {
  overview: string;
  contents: string;
};

export const PRACTICE_QUESTIONS: Readonly<Record<Locale, PracticeQuestions>> = {
  cs: {
    measures: 'Co měří test psaní?',
    metrics: 'Co znamenají WPM a přesnost?',
    start: 'Jak test začít?',
    results: 'Jak výsledek interpretovat?',
    improve: 'Jak psát rychleji bez více chyb?',
  },
  da: {
    measures: 'Hvad måler en skriveprøve?',
    metrics: 'Hvad betyder WPM og nøjagtighed?',
    start: 'Hvordan starter du testen?',
    results: 'Hvordan fortolker du resultatet?',
    improve: 'Hvordan skriver du hurtigere uden flere fejl?',
  },
  de: {
    measures: 'Was misst ein Tipp-Test?',
    metrics: 'Was bedeuten WPM und Genauigkeit?',
    start: 'Wie startest du den Test?',
    results: 'Wie deutest du das Ergebnis?',
    improve: 'Wie tippst du schneller ohne mehr Fehler?',
  },
  'en-US': {
    measures: 'What does a typing test measure?',
    metrics: 'What do WPM and accuracy mean?',
    start: 'How do you start the test?',
    results: 'How do you interpret the result?',
    improve: 'How can you type faster without more errors?',
  },
  'en-GB': {
    measures: 'What does a typing test measure?',
    metrics: 'What do WPM and accuracy mean?',
    start: 'How do you start the test?',
    results: 'How do you interpret the result?',
    improve: 'How can you type faster without more errors?',
  },
  'es-ES': {
    measures: '¿Qué mide una prueba de mecanografía?',
    metrics: '¿Qué significan WPM, PPM y precisión?',
    start: '¿Cómo se inicia la prueba?',
    results: '¿Cómo se interpreta el resultado?',
    improve: '¿Cómo escribir más rápido sin cometer más errores?',
  },
  'es-latam': {
    measures: '¿Qué mide una prueba de mecanografía?',
    metrics: '¿Qué significan WPM, PPM y precisión?',
    start: '¿Cómo se inicia la prueba?',
    results: '¿Cómo se interpreta el resultado?',
    improve: '¿Cómo escribir más rápido sin cometer más errores?',
  },
  fr: {
    measures: 'Que mesure un test de frappe ?',
    metrics: 'Que signifient WPM et précision ?',
    start: 'Comment démarrer le test ?',
    results: 'Comment interpréter le résultat ?',
    improve: 'Comment taper plus vite sans faire plus d’erreurs ?',
  },
  hr: {
    measures: 'Što mjeri test tipkanja?',
    metrics: 'Što znače WPM i točnost?',
    start: 'Kako započeti test?',
    results: 'Kako tumačiti rezultat?',
    improve: 'Kako tipkati brže bez više pogrešaka?',
  },
  hu: {
    measures: 'Mit mér a gépelési teszt?',
    metrics: 'Mit jelent a WPM és a pontosság?',
    start: 'Hogyan kezdje el a tesztet?',
    results: 'Hogyan értelmezze az eredményt?',
    improve: 'Hogyan gépeljen gyorsabban több hiba nélkül?',
  },
  it: {
    measures: 'Che cosa misura un test di digitazione?',
    metrics: 'Che cosa significano WPM e precisione?',
    start: 'Come si avvia il test?',
    results: 'Come si interpreta il risultato?',
    improve: 'Come digitare più velocemente senza più errori?',
  },
  nl: {
    measures: 'Wat meet een typetest?',
    metrics: 'Wat betekenen WPM en nauwkeurigheid?',
    start: 'Hoe start je de test?',
    results: 'Hoe interpreteer je het resultaat?',
    improve: 'Hoe typ je sneller zonder meer fouten?',
  },
  no: {
    measures: 'Hva måler en skrivetest?',
    metrics: 'Hva betyr WPM og nøyaktighet?',
    start: 'Hvordan starter du testen?',
    results: 'Hvordan tolker du resultatet?',
    improve: 'Hvordan skriver du raskere uten flere feil?',
  },
  pl: {
    measures: 'Co mierzy test pisania?',
    metrics: 'Co oznaczają WPM i dokładność?',
    start: 'Jak rozpocząć test?',
    results: 'Jak interpretować wynik?',
    improve: 'Jak pisać szybciej bez większej liczby błędów?',
  },
  'pt-BR': {
    measures: 'O que um teste de digitação mede?',
    metrics: 'O que significam WPM e precisão?',
    start: 'Como iniciar o teste?',
    results: 'Como interpretar o resultado?',
    improve: 'Como digitar mais rápido sem cometer mais erros?',
  },
  'pt-PT': {
    measures: 'O que mede um teste de escrita?',
    metrics: 'O que significam WPM e precisão?',
    start: 'Como iniciar o teste?',
    results: 'Como interpretar o resultado?',
    improve: 'Como escrever mais depressa sem cometer mais erros?',
  },
  ro: {
    measures: 'Ce măsoară un test de tastare?',
    metrics: 'Ce înseamnă WPM și precizie?',
    start: 'Cum începi testul?',
    results: 'Cum interpretezi rezultatul?',
    improve: 'Cum tastezi mai repede fără mai multe greșeli?',
  },
  sv: {
    measures: 'Vad mäter ett skrivtest?',
    metrics: 'Vad betyder WPM och noggrannhet?',
    start: 'Hur startar du testet?',
    results: 'Hur tolkar du resultatet?',
    improve: 'Hur skriver du snabbare utan fler fel?',
  },
  tr: {
    measures: 'Yazma testi neyi ölçer?',
    metrics: 'WPM ve doğruluk ne anlama gelir?',
    start: 'Test nasıl başlatılır?',
    results: 'Sonuç nasıl yorumlanır?',
    improve: 'Daha fazla hata yapmadan nasıl daha hızlı yazılır?',
  },
};

export const COURSE_QUESTIONS: Readonly<Record<Locale, CourseQuestions>> = {
  cs: {
    typingVsSpelling: 'Jaký je rozdíl mezi psaním a pravopisem?',
    beginners: 'S jakým kurzem začít?',
    language: 'V jakém jazyce jsou cvičení?',
    typingVsSpellingAnswer:
      'Psaní rozvíjí přesnost a plynulost na klávesnici. Pravopis se zaměřuje na správnou podobu slov a pravidla psaní.',
    beginnersAnswer: 'Pro začátek doporučujeme kurz psaní na klávesnici.',
    languageAnswer:
      'Kurzy se zobrazují podle jazyka zvoleného v rozhraní a jsou určeny k procvičování v tomto jazyce.',
    showGuidance: 'Zobrazit průvodce kurzy',
    hideGuidance: 'Skrýt průvodce kurzy',
  },
  da: {
    typingVsSpelling: 'Hvad er forskellen på skrivning og stavning?',
    beginners: 'Hvilket kursus skal du starte med?',
    language: 'Hvilket sprog er øvelserne på?',
    typingVsSpellingAnswer:
      'Skrivning træner nøjagtighed og flydende brug af tastaturet. Stavning fokuserer på ordformer og skriveregler.',
    beginnersAnswer: 'Vi anbefaler et skrivekursus som udgangspunkt.',
    languageAnswer:
      'Kurserne vises efter det sprog, du vælger i brugerfladen, og er lavet til øvelse på det sprog.',
    showGuidance: 'Vis kursusvejledning',
    hideGuidance: 'Skjul kursusvejledning',
  },
  de: {
    typingVsSpelling: 'Was ist der Unterschied zwischen Tippen und Rechtschreibung?',
    beginners: 'Mit welchem Kurs solltest du beginnen?',
    language: 'In welcher Sprache sind die Übungen?',
    typingVsSpellingAnswer:
      'Tippen trainiert Genauigkeit und flüssige Tastaturarbeit. Rechtschreibung behandelt korrekte Wortformen und Schreibregeln.',
    beginnersAnswer: 'Als Einstieg empfehlen wir einen Tippkurs.',
    languageAnswer:
      'Die Kurse werden nach der in der Benutzeroberfläche gewählten Sprache angezeigt und sind für Übungen in dieser Sprache gedacht.',
    showGuidance: 'Kursleitfaden anzeigen',
    hideGuidance: 'Kursleitfaden ausblenden',
  },
  'en-US': {
    typingVsSpelling: 'What is the difference between typing and spelling?',
    beginners: 'Which course should you start with?',
    language: 'What language are the exercises in?',
    typingVsSpellingAnswer:
      'Typing develops keyboard accuracy and fluency. Spelling focuses on correct word forms and writing rules.',
    beginnersAnswer: 'We recommend starting with a typing course.',
    languageAnswer:
      'Courses are shown for the language selected in the interface and are designed for practice in that language.',
    showGuidance: 'Show course guidance',
    hideGuidance: 'Hide course guidance',
  },
  'en-GB': {
    typingVsSpelling: 'What is the difference between typing and spelling?',
    beginners: 'Which course should you start with?',
    language: 'What language are the exercises in?',
    typingVsSpellingAnswer:
      'Typing develops keyboard accuracy and fluency. Spelling focuses on correct word forms and writing rules.',
    beginnersAnswer: 'We recommend starting with a typing course.',
    languageAnswer:
      'Courses are shown for the language selected in the interface and are designed for practice in that language.',
    showGuidance: 'Show course guidance',
    hideGuidance: 'Hide course guidance',
  },
  'es-ES': {
    typingVsSpelling: '¿Qué diferencia hay entre mecanografía y ortografía?',
    beginners: '¿Con qué curso conviene empezar?',
    language: '¿En qué idioma están los ejercicios?',
    typingVsSpellingAnswer:
      'La mecanografía desarrolla precisión y fluidez con el teclado. La ortografía se centra en la forma correcta de las palabras y sus reglas.',
    beginnersAnswer: 'Para empezar, recomendamos el curso de mecanografía.',
    languageAnswer:
      'Los cursos se muestran según el idioma seleccionado en la interfaz y están pensados para practicar en ese idioma.',
    showGuidance: 'Mostrar guía de cursos',
    hideGuidance: 'Ocultar guía de cursos',
  },
  'es-latam': {
    typingVsSpelling: '¿Qué diferencia hay entre mecanografía y ortografía?',
    beginners: '¿Con qué curso conviene empezar?',
    language: '¿En qué idioma están los ejercicios?',
    typingVsSpellingAnswer:
      'La mecanografía desarrolla precisión y fluidez con el teclado. La ortografía se centra en la forma correcta de las palabras y sus reglas.',
    beginnersAnswer: 'Para empezar, recomendamos el curso de mecanografía.',
    languageAnswer:
      'Los cursos se muestran según el idioma seleccionado en la interfaz y están pensados para practicar en ese idioma.',
    showGuidance: 'Mostrar guía de cursos',
    hideGuidance: 'Ocultar guía de cursos',
  },
  fr: {
    typingVsSpelling: 'Quelle différence entre frappe et orthographe ?',
    beginners: 'Par quel cours commencer ?',
    language: 'Dans quelle langue sont les exercices ?',
    typingVsSpellingAnswer:
      'La frappe développe la précision et la fluidité au clavier. L’orthographe porte sur la forme correcte des mots et les règles d’écriture.',
    beginnersAnswer: 'Pour commencer, nous recommandons un cours de frappe.',
    languageAnswer:
      'Les cours sont affichés selon la langue choisie dans l’interface et sont conçus pour pratiquer cette langue.',
    showGuidance: 'Afficher le guide des cours',
    hideGuidance: 'Masquer le guide des cours',
  },
  hr: {
    typingVsSpelling: 'Koja je razlika između tipkanja i pravopisa?',
    beginners: 'S kojim tečajem početi?',
    language: 'Na kojem su jeziku vježbe?',
    typingVsSpellingAnswer:
      'Tipkanje razvija točnost i tečnost rada na tipkovnici. Pravopis se bavi pravilnim oblicima riječi i pravilima pisanja.',
    beginnersAnswer: 'Za početak preporučujemo tečaj tipkanja.',
    languageAnswer:
      'Tečajevi se prikazuju prema jeziku odabranom u sučelju i namijenjeni su vježbanju na tom jeziku.',
    showGuidance: 'Prikaži vodič za tečajeve',
    hideGuidance: 'Sakrij vodič za tečajeve',
  },
  hu: {
    typingVsSpelling: 'Mi a különbség a gépelés és a helyesírás között?',
    beginners: 'Melyik kurzussal kezdjen?',
    language: 'Milyen nyelvűek a gyakorlatok?',
    typingVsSpellingAnswer:
      'A gépelés a billentyűzetes pontosságot és folyékonyságot fejleszti. A helyesírás a szavak helyes alakjára és írási szabályaira összpontosít.',
    beginnersAnswer: 'Kezdésként gépelési kurzust ajánlunk.',
    languageAnswer:
      'A kurzusok a felületen kiválasztott nyelv szerint jelennek meg, és azon a nyelven való gyakorlásra készültek.',
    showGuidance: 'Kurzusútmutató megjelenítése',
    hideGuidance: 'Kurzusútmutató elrejtése',
  },
  it: {
    typingVsSpelling: 'Qual è la differenza tra digitazione e ortografia?',
    beginners: 'Con quale corso iniziare?',
    language: 'In quale lingua sono gli esercizi?',
    typingVsSpellingAnswer:
      'La digitazione sviluppa precisione e scioltezza sulla tastiera. L’ortografia riguarda le forme corrette delle parole e le regole di scrittura.',
    beginnersAnswer: 'Per iniziare consigliamo un corso di digitazione.',
    languageAnswer:
      'I corsi vengono mostrati in base alla lingua selezionata nell’interfaccia e sono pensati per esercitarsi in quella lingua.',
    showGuidance: 'Mostra la guida ai corsi',
    hideGuidance: 'Nascondi la guida ai corsi',
  },
  nl: {
    typingVsSpelling: 'Wat is het verschil tussen typen en spelling?',
    beginners: 'Met welke cursus begin je?',
    language: 'In welke taal zijn de oefeningen?',
    typingVsSpellingAnswer:
      'Typen ontwikkelt nauwkeurigheid en vloeiend toetsenbordgebruik. Spelling richt zich op correcte woordvormen en schrijfregels.',
    beginnersAnswer: 'We raden aan om met een typecursus te beginnen.',
    languageAnswer:
      'Cursussen worden getoond voor de taal die je in de interface kiest en zijn bedoeld om in die taal te oefenen.',
    showGuidance: 'Cursusgids tonen',
    hideGuidance: 'Cursusgids verbergen',
  },
  no: {
    typingVsSpelling: 'Hva er forskjellen på skriving og rettskriving?',
    beginners: 'Hvilket kurs bør du starte med?',
    language: 'Hvilket språk er øvelsene på?',
    typingVsSpellingAnswer:
      'Skriving utvikler nøyaktighet og flyt på tastaturet. Rettskriving handler om riktige ordformer og skriveregler.',
    beginnersAnswer: 'Vi anbefaler å starte med et skrivekurs.',
    languageAnswer:
      'Kursene vises for språket du velger i grensesnittet, og er laget for øving på det språket.',
    showGuidance: 'Vis kursveiledning',
    hideGuidance: 'Skjul kursveiledning',
  },
  pl: {
    typingVsSpelling: 'Jaka jest różnica między pisaniem a ortografią?',
    beginners: 'Od którego kursu zacząć?',
    language: 'W jakim języku są ćwiczenia?',
    typingVsSpellingAnswer:
      'Pisanie rozwija dokładność i płynność pracy na klawiaturze. Ortografia dotyczy poprawnych form wyrazów i zasad pisowni.',
    beginnersAnswer: 'Na początek zalecamy kurs pisania na klawiaturze.',
    languageAnswer:
      'Kursy są wyświetlane dla języka wybranego w interfejsie i służą do ćwiczenia w tym języku.',
    showGuidance: 'Pokaż przewodnik po kursach',
    hideGuidance: 'Ukryj przewodnik po kursach',
  },
  'pt-BR': {
    typingVsSpelling: 'Qual é a diferença entre digitação e ortografia?',
    beginners: 'Com qual curso começar?',
    language: 'Em que idioma estão os exercícios?',
    typingVsSpellingAnswer:
      'A digitação desenvolve precisão e fluidez no teclado. A ortografia trata das formas corretas das palavras e das regras de escrita.',
    beginnersAnswer: 'Para começar, recomendamos um curso de digitação.',
    languageAnswer:
      'Os cursos são mostrados conforme o idioma selecionado na interface e são pensados para praticar nesse idioma.',
    showGuidance: 'Mostrar guia dos cursos',
    hideGuidance: 'Ocultar guia dos cursos',
  },
  'pt-PT': {
    typingVsSpelling: 'Qual é a diferença entre escrita e ortografia?',
    beginners: 'Com que curso deve começar?',
    language: 'Em que língua estão os exercícios?',
    typingVsSpellingAnswer:
      'A escrita desenvolve precisão e fluidez no teclado. A ortografia centra-se nas formas corretas das palavras e nas regras de escrita.',
    beginnersAnswer: 'Para começar, recomendamos um curso de escrita.',
    languageAnswer:
      'Os cursos são apresentados de acordo com a língua selecionada na interface e destinam-se à prática nessa língua.',
    showGuidance: 'Mostrar guia dos cursos',
    hideGuidance: 'Ocultar guia dos cursos',
  },
  ro: {
    typingVsSpelling: 'Care este diferența dintre tastare și ortografie?',
    beginners: 'Cu ce curs ar trebui să începi?',
    language: 'În ce limbă sunt exercițiile?',
    typingVsSpellingAnswer:
      'Tastarea dezvoltă precizia și fluența la tastatură. Ortografia se concentrează pe formele corecte ale cuvintelor și regulile de scriere.',
    beginnersAnswer: 'Pentru început, recomandăm un curs de tastare.',
    languageAnswer:
      'Cursurile sunt afișate pentru limba aleasă în interfață și sunt concepute pentru a exersa în acea limbă.',
    showGuidance: 'Afișează ghidul cursurilor',
    hideGuidance: 'Ascunde ghidul cursurilor',
  },
  sv: {
    typingVsSpelling: 'Vad är skillnaden mellan skrivning och stavning?',
    beginners: 'Vilken kurs ska du börja med?',
    language: 'Vilket språk är övningarna på?',
    typingVsSpellingAnswer:
      'Skrivning utvecklar noggrannhet och flyt på tangentbordet. Stavning fokuserar på korrekta ordformer och skrivregler.',
    beginnersAnswer: 'Vi rekommenderar att börja med en skrivkurs.',
    languageAnswer:
      'Kurser visas för språket du väljer i gränssnittet och är avsedda för övning på det språket.',
    showGuidance: 'Visa kursguide',
    hideGuidance: 'Dölj kursguide',
  },
  tr: {
    typingVsSpelling: 'Yazma ve imla arasındaki fark nedir?',
    beginners: 'Hangi kursla başlamalısınız?',
    language: 'Alıştırmalar hangi dilde?',
    typingVsSpellingAnswer:
      'Yazma, klavyede doğruluğu ve akıcılığı geliştirir. İmla, sözcüklerin doğru biçimlerine ve yazım kurallarına odaklanır.',
    beginnersAnswer: 'Başlangıç için bir yazma kursunu öneriyoruz.',
    languageAnswer:
      'Kurslar, arayüzde seçtiğiniz dile göre gösterilir ve o dilde pratik yapmak için tasarlanmıştır.',
    showGuidance: 'Kurs rehberini göster',
    hideGuidance: 'Kurs rehberini gizle',
  },
};

export const LESSON_LABELS: Readonly<Record<Locale, LessonLabels>> = {
  cs: { overview: 'Co tento kurz obsahuje?', contents: 'Obsah kurzu' },
  da: { overview: 'Hvad indeholder dette kursus?', contents: 'Kursusindhold' },
  de: { overview: 'Was enthält dieser Kurs?', contents: 'Kursinhalt' },
  'en-US': { overview: 'What does this course include?', contents: 'Course contents' },
  'en-GB': { overview: 'What does this course include?', contents: 'Course contents' },
  'es-ES': { overview: '¿Qué contiene este curso?', contents: 'Contenido del curso' },
  'es-latam': { overview: '¿Qué contiene este curso?', contents: 'Contenido del curso' },
  fr: { overview: 'Que contient ce cours ?', contents: 'Contenu du cours' },
  hr: { overview: 'Što ovaj tečaj sadrži?', contents: 'Sadržaj tečaja' },
  hu: { overview: 'Mit tartalmaz ez a kurzus?', contents: 'A kurzus tartalma' },
  it: { overview: 'Che cosa include questo corso?', contents: 'Contenuti del corso' },
  nl: { overview: 'Wat bevat deze cursus?', contents: 'Cursusinhoud' },
  no: { overview: 'Hva inneholder dette kurset?', contents: 'Kursinnhold' },
  pl: { overview: 'Co zawiera ten kurs?', contents: 'Zawartość kursu' },
  'pt-BR': { overview: 'O que este curso contém?', contents: 'Conteúdo do curso' },
  'pt-PT': { overview: 'O que contém este curso?', contents: 'Conteúdo do curso' },
  ro: { overview: 'Ce conține acest curs?', contents: 'Conținutul cursului' },
  sv: { overview: 'Vad innehåller den här kursen?', contents: 'Kursinnehåll' },
  tr: { overview: 'Bu kurs neleri içerir?', contents: 'Kurs içeriği' },
};
