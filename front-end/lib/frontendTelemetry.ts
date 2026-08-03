'use client';

import { onCLS, onINP, onLCP } from 'web-vitals';

type TelemetryEvent = {
  type: 'vital' | 'navigation' | 'error' | 'request' | 'session';
  route: string;
  metricName?: 'lcp' | 'inp' | 'cls';
  errorCategory?: 'runtime' | 'promise' | 'resource';
  statusClass?: '2xx' | '3xx' | '4xx' | '5xx' | 'network';
  value?: number;
};

const MAX_BATCH_SIZE = 20;
const MIN_FLUSH_INTERVAL_MS = 5_000;
const TELEMETRY_ENDPOINT = `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '')}/v1/telemetry/frontend`;
let queue: TelemetryEvent[] = [];
let lastFlushAt = 0;
let sampled = false;

function samplingRate() {
  const value = Number(process.env.NEXT_PUBLIC_OBSERVABILITY_SAMPLE_RATE ?? '0.1');
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.1;
}

function route() {
  if (typeof window === 'undefined') return 'unknown';
  return window.location.pathname.split(/[?#]/, 1)[0] || 'unknown';
}

function statusClass(status: number): TelemetryEvent['statusClass'] {
  if (status >= 500) return '5xx';
  if (status >= 400) return '4xx';
  if (status >= 300) return '3xx';
  return '2xx';
}

function flush() {
  if (!sampled || queue.length === 0) return;
  const events = queue.splice(0, MAX_BATCH_SIZE);
  lastFlushAt = Date.now();
  const payload = JSON.stringify({ events });
  const blob = new Blob([payload], { type: 'application/json' });
  if (typeof navigator !== 'undefined' && navigator.sendBeacon?.(TELEMETRY_ENDPOINT, blob)) return;
  void fetch(TELEMETRY_ENDPOINT, {
    method: 'POST',
    body: payload,
    headers: { 'content-type': 'application/json' },
    credentials: 'omit',
    keepalive: true,
  }).catch(() => undefined);
}

function enqueue(event: TelemetryEvent) {
  if (!sampled) return;
  queue.push(event);
  if (queue.length >= MAX_BATCH_SIZE || Date.now() - lastFlushAt >= MIN_FLUSH_INTERVAL_MS) flush();
}

export function recordFrontendRequest(endpoint: string, durationSeconds: number, status?: number) {
  enqueue({
    type: 'request',
    route: endpoint.split(/[?#]/, 1)[0],
    statusClass: status === undefined ? 'network' : statusClass(status),
    value: Math.min(120, Math.max(0, durationSeconds)),
  });
}

export function startFrontendTelemetry() {
  if (typeof window === 'undefined' || sampled) return;
  sampled = Math.random() < samplingRate();
  if (!sampled) return;

  enqueue({ type: 'session', route: route() });
  onLCP((metric) => enqueue({ type: 'vital', metricName: 'lcp', route: route(), value: metric.value / 1000 }));
  onINP((metric) => enqueue({ type: 'vital', metricName: 'inp', route: route(), value: metric.value / 1000 }));
  onCLS((metric) => enqueue({ type: 'vital', metricName: 'cls', route: route(), value: metric.value }));

  window.addEventListener('error', (event) => {
    enqueue({ type: 'error', route: route(), errorCategory: event.target instanceof HTMLScriptElement ? 'resource' : 'runtime' });
  });
  window.addEventListener('unhandledrejection', () => {
    enqueue({ type: 'error', route: route(), errorCategory: 'promise' });
  });
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (navigation) enqueue({ type: 'navigation', route: route(), value: navigation.duration / 1000 });
  }, { once: true });
  window.addEventListener('pagehide', flush);
}
