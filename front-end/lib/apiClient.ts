// lib/apiClient.ts

// ─── Configuración ───
import { recordFrontendRequest } from './frontendTelemetry';

function normalizeApiBaseUrl(url: string): string {
  const trimmedUrl = url.replace(/\/+$/, '');
  return trimmedUrl.endsWith('/v1') ? trimmedUrl : `${trimmedUrl}/v1`;
}

export const API_BASE_URL = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
);
const GLOBAL_RATE_LIMIT_WINDOW_MS = 1000;
const GLOBAL_RATE_LIMIT_MAX_REQUESTS = 10;
const ENDPOINT_RATE_LIMIT_WINDOW_MS = 1000;
const ENDPOINT_RATE_LIMIT_MAX_REQUESTS = 3;

type RequestBucket = number[];

const globalRequestBucket: RequestBucket = [];
const endpointRequestBuckets = new Map<string, RequestBucket>();

// ─── Error personalizado ───
export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pruneBucket(bucket: RequestBucket, windowMs: number, now: number): void {
  while (bucket.length > 0 && now - bucket[0] >= windowMs) {
    bucket.shift();
  }
}

function getBucketWaitTime(
  bucket: RequestBucket,
  windowMs: number,
  maxRequests: number,
  now: number,
) {
  pruneBucket(bucket, windowMs, now);
  if (bucket.length < maxRequests) return 0;
  return Math.max(0, windowMs - (now - bucket[0]));
}

async function acquireRequestSlot(requestKey: string): Promise<void> {
  while (true) {
    const now = Date.now();
    const endpointBucket = endpointRequestBuckets.get(requestKey) ?? [];
    const globalWait = getBucketWaitTime(
      globalRequestBucket,
      GLOBAL_RATE_LIMIT_WINDOW_MS,
      GLOBAL_RATE_LIMIT_MAX_REQUESTS,
      now,
    );
    const endpointWait = getBucketWaitTime(
      endpointBucket,
      ENDPOINT_RATE_LIMIT_WINDOW_MS,
      ENDPOINT_RATE_LIMIT_MAX_REQUESTS,
      now,
    );
    const waitTime = Math.max(globalWait, endpointWait);

    if (waitTime === 0) {
      globalRequestBucket.push(now);
      endpointBucket.push(now);
      endpointRequestBuckets.set(requestKey, endpointBucket);
      return;
    }

    await sleep(waitTime);
  }
}

// ─── Cliente HTTP base (sin interceptor de refresh automático) ───
export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();
  await acquireRequestSlot(`${method}:${endpoint}`);

  const headers: HeadersInit = { ...(options.headers as Record<string, string>) };
  const hasBody = options.body !== undefined && options.body !== null;

  if (hasBody && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (error) {
    recordFrontendRequest(endpoint, ((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt) / 1000);
    throw error;
  }
  recordFrontendRequest(
    endpoint,
    ((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt) / 1000,
    response.status,
  );

  // ─── Manejo de errores HTTP sin reintentar ───
  if (!response.ok) {
    let errorMessage = response.statusText;
    let errorData: unknown;

    try {
      errorData = await response.json();
      if (errorData && typeof errorData === 'object' && 'message' in errorData) {
        const msg = (errorData as { message: string | string[] }).message;
        errorMessage = Array.isArray(msg) ? msg.join(', ') : msg;
      }
    } catch {
      // No JSON body
    }

    throw new APIError(response.status, errorMessage, errorData);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ─── Métodos de conveniencia ───
export function apiGet<T = unknown>(endpoint: string, options?: RequestInit): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: 'GET' });
}

export function apiPost<T = unknown>(
  endpoint: string,
  body?: unknown,
  options?: RequestInit,
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function apiPut<T = unknown>(
  endpoint: string,
  body?: unknown,
  options?: RequestInit,
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function apiPatch<T = unknown>(
  endpoint: string,
  body?: unknown,
  options?: RequestInit,
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function apiDelete<T = unknown>(endpoint: string, options?: RequestInit): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: 'DELETE' });
}
