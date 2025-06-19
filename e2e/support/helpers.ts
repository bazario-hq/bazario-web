import { expect, type APIRequestContext, type Page } from '@playwright/test';
import fx from './fixtures.json' with { type: 'json' };

export { fx };

export const API_URL = `http://localhost:${process.env.E2E_API_PORT ?? 3999}`;

export interface Session {
  accessToken: string;
  refreshToken: string;
  user: { id: number; email: string; name: string };
}

export async function apiLogin(request: APIRequestContext, email: string, password = fx.password): Promise<Session> {
  const res = await request.post(`${API_URL}/api/auth/login`, { data: { email, password } });
  expect(res.ok(), `login ${email}`).toBeTruthy();
  return res.json();
}

let seq = 0;

/** Creates a brand-new buyer through the API so tests don't share carts or orders. */
export async function newBuyer(request: APIRequestContext, name = 'Test Shopper') {
  const email = `shopper-${Date.now()}-${++seq}@bazario.example`;
  const res = await request.post(`${API_URL}/api/auth/signup`, { data: { email, password: fx.password, name } });
  expect(res.ok()).toBeTruthy();
  const session: Session = await res.json();
  return { email, name, session };
}

/** Signs the page in by storing tokens the way the app does, then reloads. */
export async function signIn(page: Page, request: APIRequestContext, email: string) {
  const session = await apiLogin(request, email);
  await applySession(page, session);
  return session;
}

export async function applySession(page: Page, session: Pick<Session, 'accessToken' | 'refreshToken'>) {
  await page.goto('/');
  await page.evaluate((tokens) => localStorage.setItem('bz.auth', JSON.stringify(tokens)), {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  });
}

export async function productId(request: APIRequestContext, name: string) {
  const res = await request.get(`${API_URL}/api/products`, { params: { q: name, pageSize: 5 } });
  const body = await res.json();
  const match = body.items.find((p: { name: string }) => p.name === name);
  expect(match, `product ${name}`).toBeTruthy();
  return match.id as number;
}

export async function addToCartViaApi(request: APIRequestContext, token: string, id: number, quantity: number) {
  const res = await request.put(`${API_URL}/api/cart/items/${id}`, {
    data: { quantity },
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.ok()).toBeTruthy();
}

export async function placeOrderViaApi(request: APIRequestContext, token: string) {
  const headers = { Authorization: `Bearer ${token}` };
  const quote = await (
    await request.post(`${API_URL}/api/checkout/quote`, {
      headers,
      data: { shippingAddress: { fullName: 'Test Shopper', line1: '1 Lake Road', city: 'Kandy', postalCode: '20000', country: 'LK' } },
    })
  ).json();
  const res = await request.post(`${API_URL}/api/checkout/confirm`, {
    headers,
    data: { quoteId: quote.quoteId, payment: { cardNumber: '4242424242424242', expMonth: 12, expYear: 2031, cvc: '123' } },
  });
  expect(res.ok()).toBeTruthy();
  return res.json();
}
