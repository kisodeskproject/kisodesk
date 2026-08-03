'use client';

import { useEffect } from 'react';

import { startFrontendTelemetry } from '@/lib/frontendTelemetry';

export default function FrontendObservability() {
  useEffect(() => {
    startFrontendTelemetry();
  }, []);
  return null;
}
