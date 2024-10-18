import { useState } from 'react';
import { Alert, Button, Card, Col, Row, Table } from 'react-bootstrap';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api, errorMessage, unwrap } from '../../api/client';
import { ErrorAlert, Loading } from '../../components/Feedback';
import { productUrl } from '../../components/ProductCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatDate, formatDateTime, formatMoney } from '../../lib/format';

export function OrderDetailPage() {
  const { id } = useParams();
  const orderId = Number(id);
  const [params] = useSearchParams();
  const { notify } = useApp();
  const { data: order, error, loading, setData } = useApi(() => unwrap(api.GET('/orders/{id}', { params: { path: { id: orderId } } })), [orderId]);
  const [cancelling, setCancelling] = useState(false);
  useDocumentTitle(`Order #${orderId}`);

  async function cancel() {
    if (!window.confirm('Cancel this order? You will be refunded in full.')) return;
    setCancelling(true);
    try {
      setData(await unwrap(api.POST('/orders/{id}/cancel', { params: { path: { id: orderId } } })));
      notify('Order cancelled');
    } catch (err) {
      notify(errorMessage(err), 'danger');
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <Loading />;
  if (error || !order) return <ErrorAlert error={error} />;
  const cancellable = order.status === 'paid' && order.items.every((i) => i.status === 'pending');
  const a = order.shippingAddress;

  return (
    <>
      {params.get('placed') && (
        <Alert variant="success" data-testid="order-placed">
          Thank you! Your order has been placed.
        </Alert>
      )}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">
          Order #{order.id} <StatusBadge status={order.status} />
        </h1>
        <Link to="/orders" className="small">
          All orders
        </Link>
      </div>
      <Row className="g-4">
        <Col lg={8}>
          <Table responsive className="align-middle">
            <thead>
              <tr>
                <th>Item</th>
                <th>Seller</th>
                <th className="text-end">Qty</th>
                <th className="text-end">Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((i) => (
                <tr key={i.id}>
                  <td>
                    <Link to={productUrl({ id: i.productId, slug: '' })}>{i.productName}</Link>
                  </td>
                  <td className="small">{i.seller.storeName}</td>
                  <td className="text-end">{i.quantity}</td>
                  <td className="text-end">{formatMoney(i.lineTotalCents)}</td>
                  <td>
                    <StatusBadge status={i.status} />
                    {i.trackingNumber && <div className="small text-muted">Tracking {i.trackingNumber}</div>}
                    {i.deliveredAt && <div className="small text-muted">Delivered {formatDate(i.deliveredAt)}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
        <Col lg={4}>
          <Card className="mb-3">
            <Card.Body className="small">
              <div>Placed {formatDateTime(order.createdAt)}</div>
              <div>Paid with card ending {order.paymentLast4}</div>
              {order.cancelledAt && <div>Cancelled {formatDateTime(order.cancelledAt)}</div>}
              <hr />
              <div className="d-flex justify-content-between">
                <span>Subtotal</span>
                <span>{formatMoney(order.subtotalCents, order.currency)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Shipping</span>
                <span>{formatMoney(order.shippingCents, order.currency)}</span>
              </div>
              <div className="d-flex justify-content-between fw-bold">
                <span>Total</span>
                <span data-testid="order-total">{formatMoney(order.totalCents, order.currency)}</span>
              </div>
            </Card.Body>
          </Card>
          <Card className="mb-3">
            <Card.Body className="small">
              <div className="fw-bold mb-1">Ship to</div>
              <address className="mb-0">
                {a.fullName}
                <br />
                {a.line1}
                {a.line2 && <>, {a.line2}</>}
                <br />
                {a.city} {a.postalCode}, {a.country}
              </address>
            </Card.Body>
          </Card>
          {cancellable && (
            <Button variant="outline-danger" className="w-100" disabled={cancelling} onClick={cancel}>
              Cancel order
            </Button>
          )}
        </Col>
      </Row>
    </>
  );
}
