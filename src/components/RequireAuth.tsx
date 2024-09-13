import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EmptyState } from './Feedback';

export function RequireAuth({ children, role }: { children: ReactNode; role?: 'seller' | 'admin' }) {
  const { user } = useApp();

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (role === 'admin' && user.role !== 'admin') {
    return <EmptyState title="You don't have access to this page." />;
  }
  if (role === 'seller' && user.seller?.status !== 'active') {
    return <Navigate to="/sell" replace />;
  }
  return <>{children}</>;
}
