import { Link } from 'react-router-dom';
import { EmptyState } from '../components/Feedback';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <EmptyState title="We couldn't find that page">
      <Link to="/">Back to the home page</Link>
    </EmptyState>
  );
}
