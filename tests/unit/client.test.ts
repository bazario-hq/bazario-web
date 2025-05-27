import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, AUTH_LOST_EVENT, unwrap } from '../../src/api/client';
import { getTokens, setTokens } from '../../src/lib/auth-storage';

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const me = { id: 1, email: 'ben@example.test', name: 'Ben', role: 'buyer', createdAt: '2026-01-01', seller: null };

describe('api client auth', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the bearer token', async () => {
    setTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    fetchMock.mockResolvedValueOnce(json(200, me));
    await unwrap(api.GET('/auth/me'));
    const req = fetchMock.mock.calls[0][0] as Request;
    expect(req.headers.get('Authorization')).toBe('Bearer access-1');
  });

  it('clears the session when the refresh token is rejected', async () => {
    setTokens({ accessToken: 'stale', refreshToken: 'revoked' });
    const lost = vi.fn();
    window.addEventListener(AUTH_LOST_EVENT, lost);
    fetchMock.mockImplementation(async (input: Request | string) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.endsWith('/auth/refresh')) return json(401, { error: { code: 'unauthorized', message: 'revoked' } });
      return json(401, { error: { code: 'unauthorized', message: 'expired' } });
    });

    await expect(unwrap(api.GET('/auth/me'))).rejects.toMatchObject({ status: 401 });
    expect(getTokens()).toBeNull();
    expect(lost).toHaveBeenCalledOnce();
    window.removeEventListener(AUTH_LOST_EVENT, lost);
  });

  it('does not try to refresh without a session', async () => {
    fetchMock.mockResolvedValueOnce(json(401, { error: { code: 'unauthorized', message: 'no token' } }));
    await expect(unwrap(api.GET('/cart'))).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('turns API errors into ApiError with code and details', async () => {
    fetchMock.mockResolvedValueOnce(json(422, { error: { code: 'unprocessable', message: 'Your cart is empty', details: [{ productId: 1 }] } }));
    const err = await unwrap(api.POST('/checkout/quote', { body: { shippingAddress: { fullName: 'a', line1: 'b', city: 'c', postalCode: 'd', country: 'LK' } } })).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 422, code: 'unprocessable', message: 'Your cart is empty', details: [{ productId: 1 }] });
  });
});
