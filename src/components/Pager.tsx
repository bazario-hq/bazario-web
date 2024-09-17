import { Pagination } from 'react-bootstrap';
import _ from 'lodash';

/** Numbered pagination with a window around the current page. */
export function Pager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  const from = Math.max(1, page - 2);
  const to = Math.min(totalPages, page + 2);
  return (
    <nav aria-label="Pages">
      <Pagination className="justify-content-center mt-4">
        <Pagination.Prev disabled={page <= 1} onClick={() => onChange(page - 1)} />
        {from > 1 && <Pagination.Item onClick={() => onChange(1)}>{1}</Pagination.Item>}
        {from > 2 && <Pagination.Ellipsis disabled />}
        {_.range(from, to + 1).map((p) => (
          <Pagination.Item key={p} active={p === page} onClick={() => onChange(p)}>
            {p}
          </Pagination.Item>
        ))}
        {to < totalPages - 1 && <Pagination.Ellipsis disabled />}
        {to < totalPages && <Pagination.Item onClick={() => onChange(totalPages)}>{totalPages}</Pagination.Item>}
        <Pagination.Next disabled={page >= totalPages} onClick={() => onChange(page + 1)} />
      </Pagination>
    </nav>
  );
}
