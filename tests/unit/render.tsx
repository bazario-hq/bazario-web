import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { AppContext, type AppContextValue } from '../../src/context/AppContext';

export function fakeApp(overrides: Partial<AppContextValue> = {}): AppContextValue {
  return {
    ready: true,
    user: null,
    categories: [],
    cart: null,
    wishlistIds: [],
    unread: { count: 0, checkedAt: 0 },
    toasts: [],
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    reloadUser: vi.fn(),
    refreshCart: vi.fn(),
    addToCart: vi.fn(async () => {}),
    setCartQuantity: vi.fn(),
    removeFromCart: vi.fn(),
    toggleWishlist: vi.fn(async () => {}),
    refreshUnread: vi.fn(),
    notify: vi.fn(),
    dismissToast: vi.fn(),
    ...overrides,
  };
}

export function renderWithApp(ui: ReactElement, { app = fakeApp(), path = '/' }: { app?: AppContextValue; path?: string } = {}) {
  const result = render(
    <AppContext.Provider value={app}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="*" element={ui} />
          <Route path="/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>
    </AppContext.Provider>,
  );
  return { ...result, app };
}
