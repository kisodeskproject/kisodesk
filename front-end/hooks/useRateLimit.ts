// hooks/useRateLimit.ts
import { useRef } from 'react';

export function useRateLimit(limit: number, windowMs: number) {
  const timestamps = useRef<number[]>([]);

  const isRateLimited = () => {
    const now = Date.now();
    timestamps.current = timestamps.current.filter((ts) => now - ts < windowMs);
    if (timestamps.current.length >= limit) return true;
    timestamps.current.push(now);
    return false;
  };

  const reset = () => {
    timestamps.current = [];
  };

  return { isRateLimited, reset };
}
