import createClient from 'openapi-fetch';
import type { paths } from './schema';
import { clearTokens, getTokens, setTokens } from '../lib/auth-storage';

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
export const API_BASE = `${API_URL}/api`;

export const AUTH_LOST_EVENT = 'bz:auth-lost';

let refreshing: Promise<boolean> | null = null;

/** Rotates the refresh token. Concurrent callers share one request, since the API revokes the old token. */
export function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      const current = getTokens();
      if (!current) return false;
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: current.refreshToken }),
        });
        if (!res.ok) {
          clearTokens();
          window.dispatchEvent(new Event(AUTH_LOST_EVENT));
          return false;
        }
        const body = await res.json();
        setTokens({ accessToken: body.accessToken, refreshToken: body.refreshToken });
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

function withAuth(request: Request) {
  const tokens = getTokens();
  if (tokens && !request.headers.has('Authorization')) {
    request.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
  }
  return request;
}

/** fetch wrapper: adds the bearer token and retries once after a silent refresh on 401. */
export async function authFetch(input: Request): Promise<Response> {
  const hadToken = Boolean(getTokens());
  const retry = input.clone();
  const res = await fetch(withAuth(input));
  if (res.status !== 401 || !hadToken || input.url.endsWith('/auth/refresh') || input.url.endsWith('/auth/login')) {
    return res;
  }
  const ok = await refreshSession();
  if (!ok) return res;
  retry.headers.delete('Authorization');
  return fetch(withAuth(retry));
}

export const api = createClient<paths>({ baseUrl: API_BASE, fetch: authFetch });

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

type Result<T> = { data?: T; error?: unknown; response: Response };

/** Turns an openapi-fetch result into data or a thrown ApiError. */
export async function unwrap<T>(promise: Promise<Result<T>>): Promise<T> {
  const { data, error, response } = await promise;
  if (error !== undefined || !response.ok) {
    const body = (error ?? {}) as { error?: { code?: string; message?: string; details?: unknown } };
    throw new ApiError(
      response.status,
      body.error?.code ?? 'error',
      body.error?.message ?? `Request failed (${response.status})`,
      body.error?.details,
    );
  }
  return data as T;
}

export function errorMessage(err: unknown) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}
