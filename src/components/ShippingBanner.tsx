import { Container } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import { formatMoney } from '../lib/format';

export const FREE_SHIPPING_CENTS = 5000;

export function ShippingBanner() {
  const { cart } = useApp();
  if (!cart || cart.itemCount === 0 || cart.subtotalCents >= FREE_SHIPPING_CENTS) return null;
  const missing = FREE_SHIPPING_CENTS - cart.subtotalCents;
  return (
    <div className="shipping-banner py-2" data-testid="shipping-banner">
      <Container className="small text-center">
        You're <strong>{formatMoney(missing)}</strong> away from free shipping.
      </Container>
    </div>
  );
}
