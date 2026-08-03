// lib/errorTrackingClient.ts
import { apiPost } from '@/lib/apiClient';
import type { LessonErrorBatch } from '@/types/errorTracking';

export async function sendErrorBatch(batch: LessonErrorBatch): Promise<void> {
  await apiPost<void>(`/lessons/${batch.lessonId}/errors`, {
    netWpm: batch.netWpm,
    grossWpm: batch.grossWpm,
    accuracy: batch.accuracy,
    timeElapsed: batch.timeElapsed,
    keystrokes: batch.keystrokes.map((keystroke) => ({
      key: keystroke.key,
      position: keystroke.position,
      correct: keystroke.correct,
      expected: keystroke.expected,
    })),
  });
}
