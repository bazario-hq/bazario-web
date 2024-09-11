import type { ReactNode } from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';
import { errorMessage } from '../api/client';
import { Icon } from './Icon';

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="d-flex justify-content-center align-items-center py-5 text-muted" role="status">
      <Spinner animation="border" size="sm" className="me-2" />
      <span>{label}</span>
    </div>
  );
}

export function FullPageLoading() {
  return (
    <div className="vh-100 d-flex justify-content-center align-items-center">
      <Spinner animation="border" role="status" />
    </div>
  );
}

export function ErrorAlert({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <Alert variant="danger" className="d-flex align-items-center justify-content-between">
      <span>
        <Icon name="exclamation" className="me-2" />
        {errorMessage(error)}
      </span>
      {onRetry && (
        <Button size="sm" variant="outline-danger" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Alert>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="text-center text-muted py-5 empty-state">
      <h2 className="h5">{title}</h2>
      {children}
    </div>
  );
}
