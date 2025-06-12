import { useState } from 'react';
import { Button, Card, Form } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import { api, errorMessage, unwrap } from '../../api/client';
import type { ModerationReview } from '../../api/types';
import { EmptyState, ErrorAlert, Loading } from '../../components/Feedback';
import { Pager } from '../../components/Pager';
import { Stars } from '../../components/Rating';
import { StatusBadge } from '../../components/StatusBadge';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatDateTime } from '../../lib/format';

type Status = ModerationReview['status'];

function ReviewCard({ review, onDone }: { review: ModerationReview; onDone: () => void }) {
  const { notify } = useApp();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function decide(status: 'published' | 'rejected') {
    setBusy(true);
    try {
      await unwrap(api.PATCH('/admin/reviews/{id}', { params: { path: { id: review.id } }, body: { status, note: note || undefined } }));
      notify(status === 'published' ? 'Review published' : 'Review rejected');
      onDone();
    } catch (err) {
      notify(errorMessage(err), 'danger');
      setBusy(false);
    }
  }

  return (
    <Card className="mb-3" data-testid="moderation-review">
      <Card.Body>
        <div className="d-flex justify-content-between">
          <div>
            <Stars value={review.rating} /> <strong className="ms-1">{review.title}</strong>
          </div>
          <StatusBadge status={review.status} />
        </div>
        <p className="mt-2 mb-1">{review.body}</p>
        <div className="small text-muted mb-2">
          {review.author.name} on <Link to={`/products/${review.product.id}`}>{review.product.name}</Link> · {formatDateTime(review.createdAt)}
        </div>
        {review.moderationNote && <div className="small mb-2">Note: {review.moderationNote}</div>}
        {review.status === 'pending' && (
          <div className="d-flex gap-2">
            <Form.Control size="sm" placeholder="Note (optional)" aria-label="Moderation note" value={note} onChange={(e) => setNote(e.target.value)} />
            <Button size="sm" variant="success" disabled={busy} onClick={() => decide('published')}>
              Publish
            </Button>
            <Button size="sm" variant="danger" disabled={busy} onClick={() => decide('rejected')}>
              Reject
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export function ReviewsPage() {
  useDocumentTitle('Review moderation');
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') ?? 1);
  const status = (params.get('status') ?? 'pending') as Status;
  const { data, error, loading, reload } = useApi(
    () => unwrap(api.GET('/admin/reviews', { params: { query: { status, page, pageSize: 25 } } })),
    [status, page],
  );

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Reviews</h1>
        <Form.Select size="sm" style={{ width: 'auto' }} aria-label="Status" value={status} onChange={(e) => setParams({ status: e.target.value })}>
          <option value="pending">Waiting for moderation</option>
          <option value="published">Published</option>
          <option value="rejected">Rejected</option>
        </Form.Select>
      </div>
      {loading && <Loading />}
      {Boolean(error) && <ErrorAlert error={error} onRetry={reload} />}
      {data && !loading && data.items.length === 0 && <EmptyState title="Nothing to moderate" />}
      {data?.items.map((r) => <ReviewCard key={r.id} review={r} onDone={reload} />)}
      {data && <Pager page={page} totalPages={data.meta.totalPages} onChange={(p) => setParams({ status, page: String(p) })} />}
    </>
  );
}
