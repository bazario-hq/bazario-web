import { useEffect, useState } from 'react';
import { Button, Form, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { api, unwrap } from '../../api/client';
import type { Notification } from '../../api/types';
import { EmptyState, ErrorAlert, Loading } from '../../components/Feedback';
import { useApp } from '../../context/AppContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fromNow } from '../../lib/format';

export function NotificationsPage() {
  useDocumentTitle('Notifications');
  const { refreshUnread } = useApp();
  const [items, setItems] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  async function load(nextPage: number, replace: boolean) {
    setLoading(true);
    try {
      const res = await unwrap(api.GET('/notifications', { params: { query: { page: nextPage, pageSize: 20, unreadOnly: unreadOnly ? 'true' : undefined } } }));
      setItems((prev) => (replace ? res.items : [...prev, ...res.items]));
      setPage(nextPage);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, true);
  }, [unreadOnly]);

  async function markRead(n: Notification) {
    if (n.read) return;
    await api.POST('/notifications/{id}/read', { params: { path: { id: n.id } } });
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    refreshUnread();
  }

  async function markAll() {
    await unwrap(api.POST('/notifications/read-all'));
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    refreshUnread();
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Notifications</h1>
        <div className="d-flex gap-3 align-items-center">
          <Form.Check type="switch" id="unread-only" label="Unread only" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />
          <Button size="sm" variant="outline-secondary" onClick={markAll}>
            Mark all as read
          </Button>
        </div>
      </div>
      {Boolean(error) && <ErrorAlert error={error} />}
      {!loading && items.length === 0 && <EmptyState title="You're all caught up" />}
      <ListGroup>
        {items.map((n) => (
          <ListGroup.Item key={n.id} className={n.read ? '' : 'notification-unread'} data-testid="notification" data-read={n.read}>
            <div className="d-flex justify-content-between">
              <div>
                <div className="fw-bold">{n.title}</div>
                <div className="small">{n.body}</div>
                {n.link && (
                  <Link to={n.link} className="small" onClick={() => markRead(n)}>
                    View
                  </Link>
                )}
              </div>
              <div className="text-end small text-muted text-nowrap ms-3">
                <div>{fromNow(n.createdAt)}</div>
                {!n.read && (
                  <Button variant="link" size="sm" className="p-0" onClick={() => markRead(n)}>
                    Mark read
                  </Button>
                )}
              </div>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
      {loading && <Loading />}
      {!loading && page < totalPages && (
        <div className="text-center mt-3">
          <Button variant="outline-primary" onClick={() => load(page + 1, false)}>
            Load more
          </Button>
        </div>
      )}
    </>
  );
}
