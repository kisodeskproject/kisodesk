// hooks/useErrorTracker.ts
import { useRef, useCallback } from 'react';
import { sendErrorBatch } from '@/lib/errorTrackingClient';

interface TrackedError {
  expectedChar: string;
  typedChar: string;
  position: number;
  timestamp: number;
}

interface UseErrorTrackerReturn {
  trackError: (expectedChar: string, typedChar: string, position: number) => void;
  flush: (
    lessonId: string,
    session: {
      netWpm: number;
      grossWpm: number;
      accuracy: number;
      timeElapsed: number;
    },
  ) => Promise<void>;
  reset: () => void;
}

export function useErrorTracker(): UseErrorTrackerReturn {
  const bufferRef = useRef<TrackedError[]>([]);

  const trackError = useCallback((expectedChar: string, typedChar: string, position: number) => {
    bufferRef.current.push({
      expectedChar,
      typedChar,
      position,
      timestamp: Date.now(),
    });
  }, []);

  const flush = useCallback(
    async (
      lessonId: string,
      session: {
        netWpm: number;
        grossWpm: number;
        accuracy: number;
        timeElapsed: number;
      },
    ): Promise<void> => {
      const errors = [...bufferRef.current];
      if (errors.length === 0) return;

      await sendErrorBatch({
        lessonId,
        netWpm: session.netWpm,
        grossWpm: session.grossWpm,
        accuracy: session.accuracy,
        timeElapsed: session.timeElapsed,
        keystrokes: errors.map((e) => ({
          key: e.typedChar,
          position: e.position,
          correct: false,
          expected: e.expectedChar,
        })),
      });

      bufferRef.current = [];
    },
    [],
  );

  const reset = useCallback(() => {
    bufferRef.current = [];
  }, []);

  return { trackError, flush, reset };
}
