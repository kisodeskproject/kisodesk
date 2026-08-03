'use client';

import { createContext, useContext } from 'react';

const PublicTrialContext = createContext(false);

export function PublicTrialProvider({ children }: { children: React.ReactNode }) {
  return <PublicTrialContext.Provider value={true}>{children}</PublicTrialContext.Provider>;
}

export function usePublicTrial(): boolean {
  return useContext(PublicTrialContext);
}
