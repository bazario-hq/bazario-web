import type { RouteObject } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { CategoryPage } from './pages/buyer/CategoryPage';
import { HomePage } from './pages/buyer/HomePage';
import { SearchPage } from './pages/buyer/SearchPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'c/:slug', element: <CategoryPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'products/:id', element: <ProductPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
