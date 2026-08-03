// hooks/useKeyboard.ts
import { useState, useEffect, useCallback, useRef } from 'react';

interface KeyStats {
  key: string;
  count: number;
  errors: number;
  accuracy: number;
}

interface UseKeyboardReturn {
  pressedKeys: Set<string>;
  lastKey: string | null;
  keyStats: Map<string, KeyStats>;
  isKeyPressed: (key: string) => boolean;
  registerError: (key: string) => void; // Se eliminó el parámetro no usado expectedKey
  resetStats: () => void;
}

export function useKeyboard(): UseKeyboardReturn {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [lastKey, setLastKey] = useState<string | null>(null);
  const keyStatsRef = useRef<Map<string, KeyStats>>(new Map());

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') {
      return;
    }

    const key = e.key === ' ' ? 'Space' : e.key;

    setPressedKeys((prev) => new Set(prev).add(key));
    setLastKey(key);

    const current = keyStatsRef.current.get(key);
    if (current) {
      keyStatsRef.current.set(key, {
        ...current,
        count: current.count + 1,
      });
    } else {
      keyStatsRef.current.set(key, {
        key,
        count: 1,
        errors: 0,
        accuracy: 100,
      });
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key === ' ' ? 'Space' : e.key;
    setPressedKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const registerError = useCallback((key: string) => {
    const current = keyStatsRef.current.get(key);
    if (current) {
      const errors = current.errors + 1;
      const count = current.count;
      const accuracy = count > 0 ? ((count - errors) / count) * 100 : 100;
      keyStatsRef.current.set(key, {
        ...current,
        errors,
        accuracy,
      });
    }
  }, []);

  const resetStats = useCallback(() => {
    keyStatsRef.current.clear();
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const isKeyPressed = useCallback((key: string) => pressedKeys.has(key), [pressedKeys]);

  return {
    pressedKeys,
    lastKey,
    keyStats: keyStatsRef.current,
    isKeyPressed,
    registerError,
    resetStats,
  };
}
