import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ComponentType, ReactNode } from 'react';
import type { Lesson } from '@/types';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSaveResult = jest.fn<(...args: any[]) => Promise<any>>();
const mockLoadLessons = jest.fn<(...args: any[]) => Promise<any>>();
const mockGoToIndex = jest.fn();
const mockGoToNext = jest.fn();
const mockRecordGuestLessonProgress = jest.fn();

let mockCurrentIndex = 0;
let mockIsAuthenticated = true;
let mockIsPublicTrial = false;
let LessonPracticePage: ComponentType;

const mockLessons: Lesson[] = [
  {
    id: 'lesson-1',
    slug: 'english-a1-greetings-listen',
    courseSlug: 'english-foundations-a1-a2',
    title: 'Escucha: hello y good morning',
    instructions: 'Reproduce el audio y observa los saludos antes de continuar.',
    text: 'Escucha estos saludos en inglés.',
    type: 'explanatory',
    mediaUrl: 'listening',
    audioUrl: '/audio/lesson-1.mp3',
    targetKeys: [],
  },
  {
    id: 'lesson-2',
    slug: 'english-a1-greetings-match',
    courseSlug: 'english-foundations-a1-a2',
    title: 'Empareja saludo y significado',
    instructions: 'Selecciona un saludo en inglés y después su significado en español.',
    text: 'Une cada saludo con su significado.',
    type: 'explanatory',
    mediaUrl: 'matching',
    targetKeys: ['hello|hola', 'good morning|buenos días'],
  },
  {
    id: 'lesson-3',
    slug: 'english-a1-greetings-write',
    courseSlug: 'english-foundations-a1-a2',
    title: 'Escribe: hello y good morning',
    instructions: 'Escribe los dos saludos con calma y precisión.',
    text: 'hello\ngood morning',
    type: 'practice',
    mediaUrl: null,
    audioUrl: null,
    hideLiveWpm: false,
  },
  {
    id: 'lesson-4',
    slug: 'english-a1-greetings-dialogue',
    courseSlug: 'english-foundations-a1-a2',
    title: 'Mini diálogo',
    instructions: 'Escucha el diálogo y escríbelo siguiendo el modelo visible.',
    text: 'Hello. My name is Ana.',
    type: 'practice',
    mediaUrl: 'dialogue',
    audioUrl: '/audio/lesson-4.mp3',
    hideLiveWpm: false,
  },
];

jest.mock('next/navigation', () => ({
  useParams: () => ({
    lang: 'es',
    courseId: 'english-foundations-a1-a2',
    lessonId: mockLessons[mockCurrentIndex].slug,
  }),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: mockIsAuthenticated }),
}));

jest.mock('@/hooks/useLesson', () => ({
  useLesson: () => ({ saveResult: mockSaveResult }),
}));

jest.mock('@/contexts/PublicTrialContext', () => ({
  usePublicTrial: () => mockIsPublicTrial,
}));

jest.mock('@/lib/guestProgressStore', () => ({
  recordGuestLessonProgress: (...args: unknown[]) => mockRecordGuestLessonProgress(...args),
}));

jest.mock('@/contexts/LessonPracticeContext', () => ({
  useLessonPractice: () => ({
    lessons: mockLessons,
    currentIndex: mockCurrentIndex,
    currentLesson: mockLessons[mockCurrentIndex],
    isLast: mockCurrentIndex === mockLessons.length - 1,
    loading: false,
    error: null,
    goToNext: mockGoToNext,
    goToIndex: mockGoToIndex,
    loadLessons: mockLoadLessons,
  }),
}));

jest.mock('@/hooks/useKeyboardLayout', () => ({
  useKeyboardLayout: () => ({
    setSelectedLayout: jest.fn(),
    getLayoutForLanguage: () => ({ id: 'qwerty-us' }),
    isReady: true,
  }),
}));

jest.mock('@/lib/handSvg', () => ({
  getHandReferencesForExpectedKey: () => ({ left: null, right: null }),
  getKeyboardGuideKeysForExpectedKey: () => [],
  getNextPendingTargetKey: () => null,
}));

jest.mock('@/hooks/useLessonAudio', () => ({
  useLessonAudio: (audioUrl?: string | null) => ({
    activeAudioUrlRef: { current: audioUrl ?? null },
    audioRef: { current: null },
    audioWarning: null,
    clearPlaybackWarning: jest.fn(),
    handleAudioError: jest.fn(),
    updateAudioVolumeWarning: jest.fn(),
  }),
}));

jest.mock('@/components/layout/DashboardBackground', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/lessons/TypingArea', () => ({
  __esModule: true,
  default: ({ text }: { text: string }) => <div data-testid="typing-area">{text}</div>,
}));

jest.mock('@/components/lessons/Keyboard', () => ({
  __esModule: true,
  default: () => <div data-testid="keyboard-view">keyboard</div>,
}));

jest.mock('@/components/lessons/Results', () => ({
  __esModule: true,
  default: () => <div data-testid="results">results</div>,
}));

describe('Unidad experimental: Saludos', () => {
  beforeEach(async () => {
    ({ default: LessonPracticePage } = await import('./page'));
    mockCurrentIndex = 0;
    mockIsAuthenticated = true;
    mockIsPublicTrial = false;
    mockPush.mockClear();
    mockReplace.mockClear();
    mockSaveResult.mockReset();
    mockSaveResult.mockResolvedValue({ completed: true });
    mockLoadLessons.mockReset();
    mockLoadLessons.mockResolvedValue(undefined);
    mockGoToIndex.mockClear();
    mockGoToNext.mockClear();
    mockRecordGuestLessonProgress.mockClear();
    localStorage.clear();
  });

  it('renders listening with its educational audio control, progress and no typing or keyboard', async () => {
    const { container } = render(<LessonPracticePage />);

    expect(screen.getByText('Lección 1 de 4')).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Progreso de la unidad' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Escuchar' })).toBeTruthy();
    expect(screen.queryByTestId('typing-area')).toBeNull();
    expect(screen.queryByTestId('keyboard-view')).toBeNull();

    const audio = container.querySelector('audio');
    expect(audio).not.toBeNull();
    expect(audio?.autoplay).toBe(false);
    expect(audio?.hasAttribute('controls')).toBe(false);

    const continueButton = screen.getByRole('button', { name: 'Continuar' });
    expect((continueButton as HTMLButtonElement).disabled).toBe(true);
    fireEvent.play(audio!);
    expect(screen.getByRole('button', { name: 'Escuchar otra vez' })).toBeTruthy();
    expect((continueButton as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(continueButton);

    await waitFor(() =>
      expect(mockSaveResult).toHaveBeenCalledWith({
        lessonId: 'lesson-1',
        completed: true,
        locale: 'es-latam',
      }),
    );
  });

  it('keeps matching accessible, resets incorrect choices and marks completed pairs', async () => {
    mockCurrentIndex = 1;
    mockIsAuthenticated = false;
    mockIsPublicTrial = false;
    render(<LessonPracticePage />);

    expect(screen.getByRole('heading', { name: 'Inglés' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Español' })).toBeTruthy();
    expect(screen.queryByTestId('typing-area')).toBeNull();
    expect(screen.queryByTestId('keyboard-view')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'hola' }));
    expect(screen.getByText('Primero selecciona una opción en inglés')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'hello' }));
    fireEvent.click(screen.getByRole('button', { name: 'buenos días' }));
    expect(screen.getByText('Inténtalo de nuevo')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'hello' }).getAttribute('aria-pressed')).toBe(
      'false',
    );

    fireEvent.click(screen.getByRole('button', { name: 'hello' }));
    fireEvent.click(screen.getByRole('button', { name: 'hola' }));
    expect(screen.getByText('Correcto')).toBeTruthy();
    expect(screen.getByText('hello → hola ✓')).toBeTruthy();
    expect((screen.getByRole('button', { name: /hello/ }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(within(screen.getByRole('button', { name: /hello/ })).getByText('✓')).toBeTruthy();
    expect((screen.getByRole('button', { name: /hola/ }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'good morning' }));
    fireEvent.click(screen.getByRole('button', { name: 'buenos días' }));
    expect(screen.getByText('Actividad completada')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    await waitFor(() =>
      expect(mockRecordGuestLessonProgress).toHaveBeenCalledWith({
        courseId: 'english-foundations-a1-a2',
        lessonId: 'lesson-2',
        language: 'es',
        locale: 'es-latam',
      }),
    );
  });

  it('keeps typing, keyboard controls and metrics flow in lesson 3', () => {
    mockCurrentIndex = 2;
    const { container } = render(<LessonPracticePage />);

    expect(screen.getByText('Lección 3 de 4')).toBeTruthy();
    expect(screen.getByTestId('typing-area')).toBeTruthy();
    expect(screen.getByTestId('keyboard-view')).toBeTruthy();
    expect(container.querySelector('audio')).toBeNull();
    expect(
      screen.getByRole('switch', { name: 'Ocultar teclado' }).getAttribute('aria-checked'),
    ).toBe('true');
  });

  it('shows manual dialogue audio and intervention before typing while keeping the keyboard', () => {
    mockCurrentIndex = 3;
    const { container } = render(<LessonPracticePage />);

    const audio = container.querySelector('audio');
    const dialogue = screen.getByRole('region', { name: 'Diálogo' });
    const typing = screen.getByTestId('typing-area');
    const keyboard = screen.getByTestId('keyboard-view');

    expect(screen.getByText('Lección 4 de 4')).toBeTruthy();
    expect(audio?.autoplay).toBe(false);
    expect(audio?.hasAttribute('controls')).toBe(false);
    expect(screen.getByRole('button', { name: 'Escuchar' })).toBeTruthy();
    expect(within(dialogue).getByText('Ana')).toBeTruthy();
    expect(within(dialogue).getByText('A')).toBeTruthy();
    expect(within(dialogue).getByText('Hello. My name is Ana.')).toBeTruthy();
    expect(audio?.compareDocumentPosition(dialogue)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(dialogue.compareDocumentPosition(typing)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(typing.compareDocumentPosition(keyboard)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
