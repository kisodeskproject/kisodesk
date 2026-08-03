// lib/weakKeysClient.ts
import { apiGet } from '@/lib/apiClient';
import { WeakKeysResponse, WeakKeysParams } from '@/types/weakKeys';

export async function fetchWeakKeys(params?: WeakKeysParams): Promise<WeakKeysResponse> {
  const queryParams = new URLSearchParams();
  if (params?.language) queryParams.append('language', params.language);
  if (params?.locale) queryParams.append('locale', params.locale);
  if (params?.limit) queryParams.append('limit', String(params.limit));
  if (params?.days) queryParams.append('days', String(params.days));
  const queryString = queryParams.toString();
  const url = `/users/me/weak-keys${queryString ? `?${queryString}` : ''}`;
  return apiGet<WeakKeysResponse>(url);
}
