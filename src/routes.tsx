import type { RouteObject } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { CartPage } from './pages/buyer/CartPage';
import { CategoryPage } from './pages/buyer/CategoryPage';
import { CheckoutPage } from './pages/buyer/CheckoutPage';
import { HomePage } from './pages/buyer/HomePage';
import { ProductPage } from './pages/buyer/ProductPage';
import { SearchPage } from './pages/buyer/SearchPage';
import { StorefrontPage } from './pages/buyer/StorefrontPage';
import { WishlistPage } from './pages/buyer/WishlistPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'c/:slug', element: <CategoryPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'p/:id/:slug?', element: <ProductPage /> },
      { path: 'products/:id', element: <ProductPage /> },
      { path: 's/:slug', element: <StorefrontPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'wishlist', element: <RequireAuth><WishlistPage /></RequireAuth> },
      { path: 'cart', element: <RequireAuth><CartPage /></RequireAuth> },
      { path: 'checkout', element: <RequireAuth><CheckoutPage /></RequireAuth> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
