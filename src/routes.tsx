import type { RouteObject } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { NotFoundPage } from './pages/NotFoundPage';

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { path: 'products/:id', element: <ProductPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
