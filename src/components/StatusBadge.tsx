import { Badge } from 'react-bootstrap';
import _ from 'lodash';

const COLORS: Record<string, string> = {
  paid: 'primary',
  pending: 'warning',
  partially_shipped: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'secondary',
  active: 'success',
  draft: 'secondary',
  archived: 'dark',
  suspended: 'danger',
  published: 'success',
  rejected: 'danger',
  open: 'secondary',
  scheduled: 'info',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge bg={COLORS[status] ?? 'secondary'} className="status-badge" data-status={status}>
      {_.startCase(status)}
    </Badge>
  );
}
