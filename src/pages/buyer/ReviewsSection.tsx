import { useState, type FormEvent } from 'react';
import { Alert, Button, Card, Form } from 'react-bootstrap';
import { api, errorMessage, unwrap } from '../../api/client';
import { ErrorAlert, Loading } from '../../components/Feedback';
import { Pager } from '../../components/Pager';
import { Stars } from '../../components/Rating';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { fromNow } from '../../lib/format';

type ReviewSort = 'newest' | 'highest' | 'lowest';

export function ReviewsSection({ productId, onChanged }: { productId: number; onChanged: () => void }) {
  const { user } = useApp();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<ReviewSort>('newest');
  const reviews = useApi(
    () => unwrap(api.GET('/products/{id}/reviews', { params: { path: { id: productId }, query: { sort, page, pageSize: 10 } } })),
    [productId, sort, page],
  );

  return (
    <section aria-label="Reviews">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h5 mb-0">Reviews</h2>
        <Form.Select size="sm" style={{ width: 'auto' }} aria-label="Sort reviews" value={sort} onChange={(e) => { setSort(e.target.value as ReviewSort); setPage(1); }}>
          <option value="newest">Newest</option>
          <option value="highest">Highest rated</option>
          <option value="lowest">Lowest rated</option>
        </Form.Select>
      </div>

      {user && <ReviewForm productId={productId} onCreated={() => { reviews.reload(); onChanged(); }} />}

      {reviews.loading && <Loading />}
      {Boolean(reviews.error) && <ErrorAlert error={reviews.error} />}
      {reviews.data && reviews.data.items.length === 0 && <p className="text-muted">No reviews yet.</p>}
      {reviews.data?.items.map((r) => (
        <Card key={r.id} className="mb-2 review" data-testid="review">
          <Card.Body>
            <div className="d-flex justify-content-between">
              <Stars value={r.rating} />
              <span className="small text-muted">{fromNow(r.createdAt)}</span>
            </div>
            <div className="fw-bold mt-1">{r.title}</div>
            <p className="mb-1">{r.body}</p>
            <div className="small text-muted">{r.author.name}</div>
          </Card.Body>
        </Card>
      ))}
      {reviews.data && <Pager page={page} totalPages={reviews.data.meta.totalPages} onChange={setPage} />}
    </section>
  );
}

function ReviewForm({ productId, onCreated }: { productId: number; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const review = await unwrap(api.POST('/products/{id}/reviews', { params: { path: { id: productId } }, body: { rating, title, body } }));
      setOpen(false);
      setTitle('');
      setBody('');
      setMessage(review.status === 'pending' ? 'Thanks! Your review will appear once it has been checked.' : 'Thanks for your review!');
      onCreated();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <>
        {message && <Alert variant="success">{message}</Alert>}
        <Button variant="outline-primary" size="sm" className="mb-3" onClick={() => setOpen(true)}>
          Write a review
        </Button>
      </>
    );
  }

  return (
    <Form onSubmit={onSubmit} className="mb-4 p-3 border rounded" aria-label="Write a review">
      {error && <Alert variant="danger">{error}</Alert>}
      <Form.Group className="mb-2" controlId="review-rating">
        <Form.Label>Rating</Form.Label>
        <Form.Select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n > 1 ? 's' : ''}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
      <Form.Group className="mb-2" controlId="review-title">
        <Form.Label>Title</Form.Label>
        <Form.Control value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
      </Form.Group>
      <Form.Group className="mb-2" controlId="review-body">
        <Form.Label>Review</Form.Label>
        <Form.Control as="textarea" rows={4} value={body} onChange={(e) => setBody(e.target.value)} required maxLength={4000} />
      </Form.Group>
      <div className="d-flex gap-2">
        <Button type="submit" disabled={busy}>
          Submit review
        </Button>
        <Button variant="link" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </Form>
  );
}
