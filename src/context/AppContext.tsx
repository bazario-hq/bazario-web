import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, AUTH_LOST_EVENT, unwrap } from '../api/client';
import type { Cart, CategoryNode, Me } from '../api/types';
import { clearTokens, getTokens, setTokens } from '../lib/auth-storage';

export interface Toast {
  id: number;
  message: string;
  variant: 'success' | 'danger' | 'info';
}

export interface AppContextValue {
  ready: boolean;
  user: Me | null;
  categories: CategoryNode[];
  cart: Cart | null;
  toasts: Toast[];
  login: (email: string, password: string) => Promise<Me>;
  signup: (name: string, email: string, password: string) => Promise<Me>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
  refreshCart: () => Promise<void>;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  setCartQuantity: (productId: number, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  notify: (message: string, variant?: Toast['variant']) => void;
  dismissToast: (id: number) => void;
}

export const AppContext = createContext<AppContextValue | null>(null);

let toastSeq = 0;

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<Me | null>(null);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  async function loadCart() {
    try {
      setCart(await unwrap(api.GET('/cart')));
    } catch {
      setCart(null);
    }
  }

  async function loadSession(): Promise<Me | null> {
    if (!getTokens()) return null;
    try {
      const me = await unwrap(api.GET('/auth/me'));
      setUser(me);
      return me;
    } catch {
      clearTokens();
      setUser(null);
      return null;
    }
  }

  async function afterSignIn(me: Me) {
    setUser(me);
    await loadCart();
  }

  function resetSession() {
    setUser(null);
    setCart(null);
  }

  useEffect(() => {
    (async () => {
      const me = await loadSession();
      try {
        const data = await unwrap(api.GET('/categories'));
        setCategories(data.categories);
      } catch {
        setCategories([]);
      }
      if (me) {
        await loadCart();
      }
      setReady(true);
    })();

    const onAuthLost = () => resetSession();
    window.addEventListener(AUTH_LOST_EVENT, onAuthLost);
    return () => window.removeEventListener(AUTH_LOST_EVENT, onAuthLost);
  }, []);

  function notify(message: string, variant: Toast['variant'] = 'success') {
    const id = ++toastSeq;
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }

  const value: AppContextValue = {
    ready,
    user,
    categories,
    cart,
    toasts,
    async login(email, password) {
      const res = await unwrap(api.POST('/auth/login', { body: { email, password } }));
      setTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
      await afterSignIn(res.user);
      return res.user;
    },
    async signup(name, email, password) {
      const res = await unwrap(api.POST('/auth/signup', { body: { name, email, password } }));
      setTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
      await afterSignIn(res.user);
      return res.user;
    },
    async logout() {
      const tokens = getTokens();
      if (tokens) {
        try {
          await api.POST('/auth/logout', { body: { refreshToken: tokens.refreshToken } });
        } catch {
          // token may already be gone
        }
      }
      clearTokens();
      resetSession();
    },
    async reloadUser() {
      await loadSession();
    },
    refreshCart: loadCart,
    async addToCart(productId, quantity = 1) {
      const existing = cart?.items.find((i) => i.productId === productId)?.quantity ?? 0;
      await unwrap(api.PUT('/cart/items/{productId}', { params: { path: { productId } }, body: { quantity: existing + quantity } }));
      await loadCart();
    },
    async setCartQuantity(productId, quantity) {
      await unwrap(api.PUT('/cart/items/{productId}', { params: { path: { productId } }, body: { quantity } }));
      await loadCart();
    },
    async removeFromCart(productId) {
      await unwrap(api.DELETE('/cart/items/{productId}', { params: { path: { productId } } }));
      await loadCart();
    },
    notify,
    dismissToast(id) {
      setToasts((t) => t.filter((x) => x.id !== id));
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
