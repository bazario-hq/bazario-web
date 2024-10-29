import { useState } from 'react';
import { Button, Card, Col, Form, Row, Table } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { api, errorMessage, unwrap } from '../../api/client';
import { ErrorAlert, Loading } from '../../components/Feedback';
import { StatusBadge } from '../../components/StatusBadge';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatDate, formatDateTime, formatMoney } from '../../lib/format';

export function SellerOrderDetailPage() {
  const { orderId: param } = useParams();
  const orderId = Number(param);
  useDocumentTitle(`Order #${orderId}`);
  const { notify } = useApp();
  const { data: order, error, loading, setData } = useApi(
    () => unwrap(api.GET('/seller/orders/{orderId}', { params: { path: { orderId } } })),
    [orderId],
  );
  const [selected, setSelected] = useState<number[]>([]);
  const [tracking, setTracking] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;
  if (error || !order) return <ErrorAlert error={error} />;

  const pending = order.items.filter((i) => i.status === 'pending');
  const shipped = order.items.filter((i) => i.status === 'shipped');

  async function ship() {
    setBusy(true);
    try {
      const itemIds = selected.length ? selected : undefined;
      setData(await unwrap(api.POST('/seller/orders/{orderId}/ship', { params: { path: { orderId } }, body: { itemIds, trackingNumber: tracking.trim() } })));
      setSelected([]);
      setTracking('');
      notify('Marked as shipped');
    } catch (err) {
      notify(errorMessage(err), 'danger');
    } finally {
      setBusy(false);
    }
  }

  async function deliver() {
    setBusy(true);
    try {
      setData(await unwrap(api.POST('/seller/orders/{orderId}/deliver', { params: { path: { orderId } }, body: {} })));
      notify('Marked as delivered');
    } catch (err) {
      notify(errorMessage(err), 'danger');
    } finally {
      setBusy(false);
    }
  }

  const a = order.shippingAddress;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Order #{order.orderId}</h1>
        <Link to="/seller/orders" className="small">
          All orders
        </Link>
      </div>
      <Row className="g-4">
        <Col lg={8}>
          <Table className="align-middle">
            <thead>
              <tr>
                <th></th>
                <th>Item</th>
                <th className="text-end">Qty</th>
                <th className="text-end">Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((i) => (
                <tr key={i.id} data-testid="seller-order-item">
                  <td>
                    {i.status === 'pending' && (
                      <Form.Check
                        aria-label={`Select ${i.productName}`}
                        checked={selected.includes(i.id)}
                        onChange={(e) => setSelected((s) => (e.target.checked ? [...s, i.id] : s.filter((x) => x !== i.id)))}
                      />
                    )}
                  </td>
                  <td>{i.productName}</td>
                  <td className="text-end">{i.quantity}</td>
                  <td className="text-end">{formatMoney(i.unitPriceCents * i.quantity)}</td>
                  <td>
                    <StatusBadge status={i.status} />
                    {i.trackingNumber && <div className="small text-muted">Tracking {i.trackingNumber}</div>}
                    {i.shippedAt && <div className="small text-muted">Shipped {formatDate(i.shippedAt)}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {pending.length > 0 && (
            <Card className="mb-3">
              <Card.Body className="d-flex gap-2 align-items-end flex-wrap">
                <Form.Group controlId="tracking" className="flex-grow-1">
                  <Form.Label className="small">Tracking number</Form.Label>
                  <Form.Control size="sm" value={tracking} onChange={(e) => setTracking(e.target.value)} />
                </Form.Group>
                <Button size="sm" disabled={busy || !tracking.trim()} onClick={ship}>
                  Ship {selected.length ? `${selected.length} selected` : 'all pending'}
                </Button>
              </Card.Body>
            </Card>
          )}
          {shipped.length > 0 && (
            <Button size="sm" variant="outline-success" disabled={busy} onClick={deliver}>
              Mark shipped items delivered
            </Button>
          )}
        </Col>
        <Col lg={4}>
          <Card>
            <Card.Body className="small">
              <div>Placed {formatDateTime(order.createdAt)}</div>
              <div>Buyer: {order.buyerName}</div>
              <div className="fw-bold mt-2">Your total: {formatMoney(order.totalCents)}</div>
              <hr />
              <div className="fw-bold mb-1">Ship to</div>
              <address className="mb-0">
                {a.fullName}
                <br />
                {a.line1}
                {a.line2 && <>, {a.line2}</>}
                <br />
                {a.city} {a.postalCode}, {a.country}
                {a.phone && (
                  <>
                    <br />
                    {a.phone}
                  </>
                )}
              </address>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}
