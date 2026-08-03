'use client';

import { onCLS, onINP, onLCP } from 'web-vitals';
import { readCookieConsent } from '@/components/legal/cookieConsent';

type TelemetryEvent = {
  type: 'vital' | 'navigation' | 'error' | 'request' | 'session' | 'page_view' | 'analytics_session_started' | 'practice_started' | 'practice_completed' | 'practice_abandoned';
  route: string;
  metricName?: 'lcp' | 'inp' | 'cls';
  errorCategory?: 'runtime' | 'promise' | 'resource';
  statusClass?: '2xx' | '3xx' | '4xx' | '5xx' | 'network';
  value?: number;
  authState?: 'anonymous' | 'authenticated';
  language?: string;
  layout?: string;
};

const MAX_BATCH_SIZE = 20;
const MIN_FLUSH_INTERVAL_MS = 5_000;
const TELEMETRY_ENDPOINT = `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '')}/v1/telemetry/frontend`;
let queue: TelemetryEvent[] = [];
let lastFlushAt = 0;
let sampled = false;
const ANALYTICS_SESSION_COOKIE = 'kiso_analytics_session';
const SESSION_IDLE_MS = 30 * 60 * 1000;

function hasAnalyticsConsent() {
  return typeof window !== 'undefined' && readCookieConsent()?.status === 'accepted';
}

function ensureAnalyticsSession() {
  if (!hasAnalyticsConsent()) return false;
  const now = Date.now();
  const current = document.cookie.split('; ').find((item) => item.startsWith(`${ANALYTICS_SESSION_COOKIE}=`));
  const expiry = current ? Number(current.split('=')[1]?.split('.').at(-1)) : 0;
  const isNew = !Number.isFinite(expiry) || expiry <= now;
  const sessionValue = current?.split('=')[1]?.split('.')[0] || crypto.randomUUID();
  document.cookie = `${ANALYTICS_SESSION_COOKIE}=${sessionValue}.${now + SESSION_IDLE_MS}; Max-Age=${SESSION_IDLE_MS / 1000}; Path=/; SameSite=Lax; Secure`;
  return isNew;
}

function clearAnalyticsSession() {
  document.cookie = `${ANALYTICS_SESSION_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
}

export function stopFrontendAnalytics() {
  queue = [];
  sampled = false;
  if (typeof window !== 'undefined') clearAnalyticsSession();
}

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

/** Actividad observada en navegador: sin muestreo, sin identidad y condicionada a consentimiento. */
export function recordObservedPractice(
  type: 'practice_started' | 'practice_completed' | 'practice_abandoned',
  attributes: { authState: 'anonymous' | 'authenticated'; language: string; layout: string },
) {
  if (!hasAnalyticsConsent()) return;
  const event: TelemetryEvent = { type, route: route(), ...attributes };
  const payload = JSON.stringify({ events: [event] });
  void fetch(TELEMETRY_ENDPOINT, {
    method: 'POST', body: payload, headers: { 'content-type': 'application/json' }, credentials: 'omit', keepalive: true,
  }).catch(() => undefined);
}

export function recordObservedPageView(pathname: string) {
  if (!hasAnalyticsConsent()) return;
  const payload = JSON.stringify({ events: [{ type: 'page_view', route: pathname.split(/[?#]/, 1)[0] || 'unknown' }] });
  void fetch(TELEMETRY_ENDPOINT, {
    method: 'POST', body: payload, headers: { 'content-type': 'application/json' }, credentials: 'omit', keepalive: true,
  }).catch(() => undefined);
}

export function recordObservedAnonymousSessionStart() {
  if (!hasAnalyticsConsent()) return;
  const payload = JSON.stringify({ events: [{ type: 'analytics_session_started', route: route() }] });
  void fetch(TELEMETRY_ENDPOINT, {
    method: 'POST', body: payload, headers: { 'content-type': 'application/json' }, credentials: 'omit', keepalive: true,
  }).catch(() => undefined);
}

export function startFrontendTelemetry() {
  if (typeof window === 'undefined' || sampled) return;
  ensureAnalyticsSession();
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

/** Renueva la sesión analítica compartida, sin enviar su identificador a Prometheus. */
export function renewFrontendAnalyticsSession() {
  return ensureAnalyticsSession();
}
