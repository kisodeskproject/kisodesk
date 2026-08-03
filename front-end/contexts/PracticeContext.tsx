// contexts/PracticeContext.tsx
// manejar práctica con WebSocket

'use client';

import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useErrorTracker } from '@/hooks/useErrorTracker';

// ============================================================
// TIPOS
// ============================================================
interface PracticeContextType {
  isConnected: boolean;
  lastMessage: any;
  sendKeystroke: (key: string, timestamp: number) => void;
  trackError: (expectedChar: string, typedChar: string, position: number) => void;
  flushErrors: (stats: {
    grossWpm: number;
    netWpm: number;
    accuracy: number;
    timeElapsed: number;
  }) => Promise<void>;
}

// ============================================================
// CONTEXTO
// ============================================================
const PracticeContext = createContext<PracticeContextType | undefined>(undefined);

// ============================================================
// PROVIDER
// ============================================================
export function PracticeProvider({ children, token }: { children: ReactNode; token?: string }) {
  // CONEXIÓN WEBSOCKET
  const { isConnected, lastMessage, sendMessage } = useWebSocket(
    'ws://localhost:3000/ws/practice',
    token,
  );

  // TRACKER DE ERRORES
  const { trackError: bufferError, reset: resetBuffer } = useErrorTracker();

  // FUNCIÓN PARA ENVIAR PULSACIONES DE TECLAS
  const sendKeystroke = (key: string, timestamp: number) => {
    sendMessage({
      type: 'KEYSTROKE',
      data: { key, timestamp },
    });
  };

  // TRACKEO DE ERRORES
  const trackError = useCallback(
    (expectedChar: string, typedChar: string, position: number) => {
      bufferError(expectedChar, typedChar, position);
    },
    [bufferError],
  );

  // FLUSH DE ERRORES AL FINALIZAR PRÁCTICA
  const flushErrors = useCallback(async () => {
    resetBuffer();
  }, [resetBuffer]);

  return (
    <PracticeContext.Provider
      value={{ isConnected, lastMessage, sendKeystroke, trackError, flushErrors }}
    >
      {children}
    </PracticeContext.Provider>
  );
}

// ============================================================
// HOOK PERSONALIZADO
// ============================================================
export function usePractice() {
  const context = useContext(PracticeContext);
  if (context === undefined) {
    throw new Error('usePractice must be used within a PracticeProvider');
  }
  return context;
}
