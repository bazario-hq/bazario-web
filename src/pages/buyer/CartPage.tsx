import { useState } from 'react';
import { Alert, Button, Card, Col, Row } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { errorMessage } from '../../api/client';
import type { CartItem } from '../../api/types';
import { EmptyState, Loading } from '../../components/Feedback';
import { Icon } from '../../components/Icon';
import { PLACEHOLDER_IMAGE } from '../../components/placeholder';
import { productUrl } from '../../components/ProductCard';
import { QuantityStepper } from '../../components/QuantityStepper';
import { useApp } from '../../context/AppContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatMoney } from '../../lib/format';

function CartLine({ item }: { item: CartItem }) {
  const { setCartQuantity, removeFromCart, notify } = useApp();
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      notify(errorMessage(err), 'danger');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mb-2 cart-line" data-testid="cart-line" data-product-id={item.productId}>
      <Card.Body>
        <Row className="align-items-center g-3">
          <Col xs={3} md={2}>
            <img src={item.image?.thumbUrl ?? PLACEHOLDER_IMAGE} alt="" className="img-fluid rounded" />
          </Col>
          <Col xs={9} md={5}>
            <Link to={productUrl({ id: item.productId, slug: item.slug })} className="fw-bold text-reset">
              {item.name}
            </Link>
            <div className="small text-muted">{item.seller.storeName}</div>
            {!item.available && <div className="small text-danger">Only {item.stock} available</div>}
          </Col>
          <Col xs={6} md={3}>
            <QuantityStepper value={item.quantity} max={Math.max(item.stock, item.quantity)} disabled={busy} onChange={(q) => run(() => setCartQuantity(item.productId, q))} />
          </Col>
          <Col xs={4} md={1} className="text-end fw-bold" data-testid="line-total">
            {formatMoney(item.lineTotalCents)}
          </Col>
          <Col xs={2} md={1} className="text-end">
            <Button variant="link" className="text-danger p-0" aria-label={`Remove ${item.name}`} disabled={busy} onClick={() => run(() => removeFromCart(item.productId))}>
              <Icon name="trash" />
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

export function CartPage() {
  useDocumentTitle('Cart');
  const { cart } = useApp();
  const navigate = useNavigate();

  if (!cart) return <Loading />;
  if (cart.items.length === 0) {
    return (
      <EmptyState title="Your cart is empty">
        <Link to="/search">Browse products</Link>
      </EmptyState>
    );
  }
  const unavailable = cart.items.some((i) => !i.available);

  return (
    <Row className="g-4">
      <Col lg={8}>
        <h1 className="h3 mb-3">Cart</h1>
        {cart.items.map((item) => (
          <CartLine key={item.productId} item={item} />
        ))}
      </Col>
      <Col lg={4}>
        <Card className="cart-summary">
          <Card.Body>
            <h2 className="h5">Summary</h2>
            <dl className="row mb-0">
              <dt className="col-6 fw-normal">Subtotal</dt>
              <dd className="col-6 text-end" data-testid="cart-subtotal">
                {formatMoney(cart.subtotalCents)}
              </dd>
              <dt className="col-6 fw-normal">Shipping</dt>
              <dd className="col-6 text-end">{cart.shippingCents === 0 ? 'Free' : formatMoney(cart.shippingCents)}</dd>
              <dt className="col-6">Total</dt>
              <dd className="col-6 text-end fw-bold" data-testid="cart-total">
                {formatMoney(cart.totalCents)}
              </dd>
            </dl>
            {unavailable && <Alert variant="warning" className="small mt-3 mb-0">Some items are no longer available in the quantity you chose.</Alert>}
            <Button className="w-100 mt-3" size="lg" disabled={unavailable} onClick={() => navigate('/checkout')}>
              Checkout
            </Button>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
