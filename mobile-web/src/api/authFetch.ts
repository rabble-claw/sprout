export type AuthTokenProvider = () => string | null | Promise<string | null>;

let tokenProvider: AuthTokenProvider | null = null;
let baseUrlOverride: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAuthTokenProvider(provider: AuthTokenProvider) {
  tokenProvider = provider;
}

export function setBaseUrl(url: string) {
  baseUrlOverride = url;
}

export function onUnauthorized(handler: () => void) {
  unauthorizedHandler = handler;
}

export function getBaseUrl(): string {
  if (baseUrlOverride) return baseUrlOverride;
  const envUrl = (import.meta as any).env?.VITE_RELAY_BASE_URL as string | undefined;
  return envUrl && envUrl.length > 0 ? envUrl : window.location.origin;
}

export async function getAuthToken(): Promise<string | null> {
  try {
    return (await tokenProvider?.()) ?? null;
  } catch {
    return null;
  }
}

export class HttpError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

export async function authFetch(input: string, init: RequestInit = {}) {
  const url = input.startsWith("http") ? input : `${getBaseUrl()}${input}`;
  let headers = new Headers(init.headers || {});
  try {
    const token = (await tokenProvider?.()) ?? null;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  } catch {}
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const res = await fetch(url, { ...init, headers });
  if (res.ok) return res;
  if (res.status === 401 && unauthorizedHandler) {
    try {
      unauthorizedHandler();
    } catch {}
  }
  let message = `HTTP ${res.status}`;
  let code: string | undefined;
  try {
    const data = await res.json();
    if (typeof data?.message === "string") message = data.message;
    if (typeof data?.error === "string") code = data.error;
  } catch {
    try {
      const text = await res.text();
      if (text) message = text;
    } catch {}
  }
  throw new HttpError(res.status, message, code);
}

export async function getJson<T>(path: string): Promise<T> {
  const res = await authFetch(path, { method: "GET" });
  return (await res.json()) as T;
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await authFetch(path, { method: "POST", body: JSON.stringify(body ?? {}) });
  return (await res.json()) as T;
}

export async function putJson<T>(path: string, body: unknown): Promise<T> {
  const res = await authFetch(path, { method: "PUT", body: JSON.stringify(body ?? {}) });
  return (await res.json()) as T;
}

export async function deleteJson<T>(path: string): Promise<T> {
  const res = await authFetch(path, { method: "DELETE" });
  if (res.status === 204) return {} as T;
  return (await res.json()) as T;
}
