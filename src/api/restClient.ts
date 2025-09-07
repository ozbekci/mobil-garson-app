// src/api/restClient.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL_KEY = 'BASE_URL';
const TOKEN_KEY = 'ACCESS_TOKEN';

export async function getBaseUrl(): Promise<string> {
  const url = await AsyncStorage.getItem(BASE_URL_KEY);
  return url || 'http://localhost:4000'; // Default
}

export async function setBaseUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(BASE_URL_KEY, url);
}

export async function getToken(): Promise<string | null> {
  return await AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const baseUrl = await getBaseUrl();
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${baseUrl}${path}`, { ...opts, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw json.error || { code: `HTTP_${res.status}`, message: 'İstek başarısız' };
  }
  // backend may return either { data: ... } or the payload directly
  return (json && Object.prototype.hasOwnProperty.call(json, 'data')) ? json.data : json;
}
