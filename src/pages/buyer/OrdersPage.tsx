import { Card, Col, Row } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import { api, unwrap } from '../../api/client';
import { EmptyState, ErrorAlert, Loading } from '../../components/Feedback';
import { Pager } from '../../components/Pager';
import { PLACEHOLDER_IMAGE } from '../../components/placeholder';
import { StatusBadge } from '../../components/StatusBadge';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatDate, formatMoney } from '../../lib/format';

export function OrdersPage() {
  useDocumentTitle('Your orders');
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') ?? 1);
  const { data, error, loading, reload } = useApi(() => unwrap(api.GET('/orders', { params: { query: { page, pageSize: 10 } } })), [page]);

  return (
    <>
      <h1 className="h3 mb-3">Your orders</h1>
      {loading && <Loading />}
      {Boolean(error) && <ErrorAlert error={error} onRetry={reload} />}
      {data && data.items.length === 0 && (
        <EmptyState title="No orders yet">
          <Link to="/search">Start shopping</Link>
        </EmptyState>
      )}
      {data?.items.map((order) => (
        <Card key={order.id} className="mb-3 order-card" data-testid="order-card">
          <Card.Header className="d-flex justify-content-between small">
            <span>
              Order <Link to={`/orders/${order.id}`}>#{order.id}</Link> · {formatDate(order.createdAt)}
            </span>
            <span>
              <StatusBadge status={order.status} /> <strong className="ms-2">{formatMoney(order.totalCents, order.currency)}</strong>
            </span>
          </Card.Header>
          <Card.Body>
            {order.items.map((item) => (
              <Row key={item.id} className="align-items-center mb-2 small">
                <Col xs={2} md={1}>
                  <img src={item.image?.thumbUrl ?? PLACEHOLDER_IMAGE} alt="" className="img-fluid rounded" />
                </Col>
                <Col>
                  <div>{item.productName}</div>
                  <div className="text-muted">
                    {item.quantity} × {formatMoney(item.unitPriceCents)} · {item.seller.storeName}
                  </div>
                </Col>
                <Col xs="auto">
                  <StatusBadge status={item.status} />
                </Col>
              </Row>
            ))}
          </Card.Body>
        </Card>
      ))}
      {data && <Pager page={page} totalPages={data.meta.totalPages} onChange={(p) => setParams({ page: String(p) })} />}
    </>
  );
}
