import { useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Table } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError, errorMessage, unwrap } from '../../api/client';
import type { CheckoutQuote, ShippingAddress } from '../../api/types';
import { EmptyState, Loading } from '../../components/Feedback';
import { useApp } from '../../context/AppContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { COUNTRIES } from '../../lib/countries';
import { formatDateTime, formatMoney } from '../../lib/format';

const ADDRESS_KEY = 'bz.lastAddress';

function savedAddress(): Partial<ShippingAddress> {
  try {
    return JSON.parse(localStorage.getItem(ADDRESS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

interface CardForm {
  cardNumber: string;
  exp: string;
  cvc: string;
}

export function CheckoutPage() {
  useDocumentTitle('Checkout');
  const { cart, user, refreshCart } = useApp();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [problems, setProblems] = useState<{ name: string; available: number }[]>([]);

  const addressForm = useForm<ShippingAddress>({
    defaultValues: { fullName: user?.name ?? '', country: 'LK', ...savedAddress() },
  });
  const cardForm = useForm<CardForm>({ defaultValues: { cardNumber: '', exp: '', cvc: '' } });

  if (!cart) return <Loading />;
  if (!quote && cart.items.length === 0) {
    return (
      <EmptyState title="Your cart is empty">
        <Link to="/search">Browse products</Link>
      </EmptyState>
    );
  }

  const onAddress = addressForm.handleSubmit(async (address) => {
    setError(null);
    setProblems([]);
    try {
      const body = { ...address, line2: address.line2 || null, phone: address.phone || null };
      const q = await unwrap(api.POST('/checkout/quote', { body: { shippingAddress: body } }));
      localStorage.setItem(ADDRESS_KEY, JSON.stringify(body));
      setQuote(q);
    } catch (err) {
      if (err instanceof ApiError && Array.isArray(err.details)) setProblems(err.details as { name: string; available: number }[]);
      setError(errorMessage(err));
    }
  });

  const onPay = cardForm.handleSubmit(async (card) => {
    if (!quote) return;
    setError(null);
    const [mm, yy] = card.exp.split('/').map((s) => Number(s.trim()));
    try {
      const order = await unwrap(
        api.POST('/checkout/confirm', {
          body: {
            quoteId: quote.quoteId,
            payment: { cardNumber: card.cardNumber.replace(/\s+/g, ''), expMonth: mm, expYear: yy < 100 ? 2000 + yy : yy, cvc: card.cvc },
          },
        }),
      );
      await refreshCart();
      navigate(`/orders/${order.id}?placed=1`);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 410 || err.status === 409)) {
        setQuote(null);
        await refreshCart();
      }
      setError(errorMessage(err));
    }
  });

  const a = addressForm.register;
  const errs = addressForm.formState.errors;

  return (
    <Row className="g-4">
      <Col lg={7}>
        <h1 className="h3 mb-3">Checkout</h1>
        {error && (
          <Alert variant="danger" data-testid="checkout-error">
            {error}
            {problems.length > 0 && (
              <ul className="mb-0 mt-2">
                {problems.map((p) => (
                  <li key={p.name}>
                    {p.name}: {p.available} available
                  </li>
                ))}
              </ul>
            )}
          </Alert>
        )}

        <Card className="mb-3">
          <Card.Body>
            <h2 className="h5">1. Shipping address</h2>
            {quote ? (
              <div className="d-flex justify-content-between">
                <address className="mb-0 small">
                  {quote.shippingAddress.fullName}
                  <br />
                  {quote.shippingAddress.line1}
                  {quote.shippingAddress.line2 && <>, {quote.shippingAddress.line2}</>}
                  <br />
                  {quote.shippingAddress.city} {quote.shippingAddress.postalCode}, {quote.shippingAddress.country}
                </address>
                <Button variant="link" size="sm" onClick={() => setQuote(null)}>
                  Change
                </Button>
              </div>
            ) : (
              <Form onSubmit={onAddress} noValidate aria-label="Shipping address">
                <Row className="g-2">
                  <Col md={12}>
                    <Form.Group controlId="fullName">
                      <Form.Label>Full name</Form.Label>
                      <Form.Control {...a('fullName', { required: true })} isInvalid={!!errs.fullName} />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group controlId="line1">
                      <Form.Label>Address</Form.Label>
                      <Form.Control {...a('line1', { required: true })} isInvalid={!!errs.line1} />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group controlId="line2">
                      <Form.Label>Apartment, suite (optional)</Form.Label>
                      <Form.Control {...a('line2')} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="city">
                      <Form.Label>City</Form.Label>
                      <Form.Control {...a('city', { required: true })} isInvalid={!!errs.city} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="postalCode">
                      <Form.Label>Postal code</Form.Label>
                      <Form.Control {...a('postalCode', { required: true })} isInvalid={!!errs.postalCode} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="country">
                      <Form.Label>Country</Form.Label>
                      <Form.Select {...a('country', { required: true })}>
                        {COUNTRIES.map(([code, name]) => (
                          <option key={code} value={code}>
                            {name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="phone">
                      <Form.Label>Phone (optional)</Form.Label>
                      <Form.Control {...a('phone')} />
                    </Form.Group>
                  </Col>
                </Row>
                <Button type="submit" className="mt-3" disabled={addressForm.formState.isSubmitting}>
                  Continue to payment
                </Button>
              </Form>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <h2 className="h5">2. Payment</h2>
            {quote ? (
              <Form onSubmit={onPay} aria-label="Payment">
                <Row className="g-2">
                  <Col md={12}>
                    <Form.Group controlId="cardNumber">
                      <Form.Label>Card number</Form.Label>
                      <Form.Control inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" {...cardForm.register('cardNumber', { required: true, minLength: 12 })} isInvalid={!!cardForm.formState.errors.cardNumber} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="exp">
                      <Form.Label>Expiry (MM/YY)</Form.Label>
                      <Form.Control placeholder="12/29" autoComplete="cc-exp" {...cardForm.register('exp', { required: true, pattern: /^\d{1,2}\s*\/\s*\d{2,4}$/ })} isInvalid={!!cardForm.formState.errors.exp} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="cvc">
                      <Form.Label>CVC</Form.Label>
                      <Form.Control inputMode="numeric" autoComplete="cc-csc" {...cardForm.register('cvc', { required: true, pattern: /^\d{3,4}$/ })} isInvalid={!!cardForm.formState.errors.cvc} />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="small text-muted mt-2">Quote valid until {formatDateTime(quote.expiresAt)}.</div>
                <Button type="submit" size="lg" className="mt-3" disabled={cardForm.formState.isSubmitting}>
                  Pay {formatMoney(quote.totalCents, quote.currency)}
                </Button>
              </Form>
            ) : (
              <p className="text-muted mb-0">Enter your shipping address first.</p>
            )}
          </Card.Body>
        </Card>
      </Col>

      <Col lg={5}>
        <Card>
          <Card.Body>
            <h2 className="h5">Order summary</h2>
            <Table size="sm" className="mb-2">
              <tbody>
                {(quote?.items ?? cart.items).map((i) => (
                  <tr key={i.productId}>
                    <td>
                      {i.name} × {i.quantity}
                    </td>
                    <td className="text-end">{formatMoney(i.lineTotalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <dl className="row mb-0 small">
              <dt className="col-6 fw-normal">Subtotal</dt>
              <dd className="col-6 text-end">{formatMoney(quote?.subtotalCents ?? cart.subtotalCents)}</dd>
              <dt className="col-6 fw-normal">Shipping</dt>
              <dd className="col-6 text-end">{formatMoney(quote?.shippingCents ?? cart.shippingCents)}</dd>
              <dt className="col-6">Total</dt>
              <dd className="col-6 text-end fw-bold" data-testid="checkout-total">
                {formatMoney(quote?.totalCents ?? cart.totalCents)}
              </dd>
            </dl>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
