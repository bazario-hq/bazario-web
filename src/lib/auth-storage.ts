// TODO(BZR-287): move the refresh token to an httpOnly cookie once the API supports it.
const KEY = 'bz.auth';

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export function getTokens(): StoredTokens | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredTokens) : null;
  } catch {
    return null;
  }
}

export function setTokens(tokens: StoredTokens) {
  localStorage.setItem(KEY, JSON.stringify(tokens));
}

export function clearTokens() {
  localStorage.removeItem(KEY);
}
