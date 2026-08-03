// front-typing/components/lessons/LessonCard
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ComponentType } from 'react';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => ({ lang: 'es' }),
  useRouter: () => ({ push: mockPush }),
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
jest.mock('@/contexts/PublicTrialContext', () => ({ usePublicTrial: () => false }));
jest.mock('@/lib/i18n', () => ({
  useTranslations: () => (key: string) =>
    ({
      'components.lessons.lessonCard.general.ariaLabel': 'Lección:',
      'components.lessons.lessonCard.general.wpm': 'WPM',
      'components.lessons.lessonCard.general.score': 'Puntuación',
      'components.lessons.lessonCard.general.accuracy': 'Precisión',
      'components.lessons.lessonCard.general.time': 'Tiempo',
      'components.lessons.lessonCard.general.placeholder': '—',
      'components.lessons.lessonCard.general.approxPrefix': '~',
      'components.lessons.lessonCard.general.minutesShort': 'min',
      'components.lessons.lessonCard.general.secondsShort': 's',
      'components.lessons.lessonCard.general.minutesCompact': 'min',
      'components.lessons.lessonCard.general.completed': 'Completada',
      'components.lessons.lessonCard.general.objectiveAccuracy': 'Objetivo 95% precisión',
      'components.lessons.lessonCard.general.lessonOrderRecommendationTitle':
        'Sigue el orden recomendado',
      'components.lessons.lessonCard.general.lessonOrderRecommendationDescription':
        'Te recomendamos seguir el orden predeterminado de las lecciones para avanzar de forma gradual.',
      'components.lessons.lessonCard.general.lessonOrderRecommendationContinue': 'Continuar',
      'components.lessons.lessonCard.general.lessonOrderRecommendationBack': 'Regresar',
    })[key],
}));

let LessonCard: ComponentType<any>;

describe('LessonCard', () => {
  beforeEach(async () => {
    ({ default: LessonCard } = await import('./LessonCard'));
    mockPush.mockClear();
  });

  it('permite continuar a una lección fuera del orden tras mostrar la recomendación', () => {
    render(
      <LessonCard
        slug="siguiente-leccion"
        courseSlug="curso-es"
        title="Siguiente lección"
        description="Practica nuevas teclas"
        difficulty="beginner"
        duration={5}
        isLocked
      />,
    );

    const lessonLink = screen.getByRole('link', { name: 'Lección: Siguiente lección' });
    expect(lessonLink.getAttribute('aria-disabled')).toBeNull();
    expect(screen.getByText('WPM')).toBeTruthy();
    expect(screen.getByText('Puntuación')).toBeTruthy();
    expect(screen.getByText('Precisión')).toBeTruthy();
    expect(screen.getByText('Tiempo')).toBeTruthy();

    fireEvent.click(lessonLink);

    expect(screen.getByRole('dialog', { name: 'Sigue el orden recomendado' })).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Regresar' }));
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(lessonLink);
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(mockPush).toHaveBeenCalledWith(
      '/es/dashboard/courses/curso-es/lessons/siguiente-leccion',
    );
  });
});
