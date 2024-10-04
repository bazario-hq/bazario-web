import { useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/client';
import { useApp } from '../context/AppContext';
import { Icon } from './Icon';

function useRequireLogin() {
  const { user } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  return () => {
    if (user) return true;
    navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
    return false;
  };
}

export function AddToCartButton({ productId, stock, quantity = 1, size, block }: { productId: number; stock: number; quantity?: number; size?: 'sm' | 'lg'; block?: boolean }) {
  const { addToCart, notify } = useApp();
  const requireLogin = useRequireLogin();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (!requireLogin()) return;
    setBusy(true);
    try {
      await addToCart(productId, quantity);
      notify('Added to cart');
    } catch (err) {
      notify(errorMessage(err), 'danger');
    } finally {
      setBusy(false);
    }
  }

  if (stock <= 0) {
    return (
      <Button size={size} variant="outline-secondary" disabled className={block ? 'w-100' : ''}>
        Out of stock
      </Button>
    );
  }
  return (
    <Button size={size} variant="primary" onClick={onClick} disabled={busy} className={block ? 'w-100' : ''}>
      {busy ? <Spinner animation="border" size="sm" /> : <Icon name="cart" className="me-1" />} Add to cart
    </Button>
  );
}

export function WishlistButton({ productId, size }: { productId: number; size?: 'sm' | 'lg' }) {
  const { wishlistIds, toggleWishlist, notify } = useApp();
  const requireLogin = useRequireLogin();
  const [busy, setBusy] = useState(false);
  const saved = wishlistIds.includes(productId);

  async function onClick() {
    if (!requireLogin()) return;
    setBusy(true);
    try {
      await toggleWishlist(productId);
    } catch (err) {
      notify(errorMessage(err), 'danger');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      size={size}
      variant={saved ? 'danger' : 'outline-danger'}
      onClick={onClick}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
    >
      {busy ? <Spinner animation="border" size="sm" /> : <Icon name={saved ? 'heart' : 'heartOutline'} />}
    </Button>
  );
}
