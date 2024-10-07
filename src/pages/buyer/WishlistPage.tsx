import { api, unwrap } from '../../api/client';
import { EmptyState, ErrorAlert, Loading } from '../../components/Feedback';
import { ProductGrid } from '../../components/ProductGrid';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function WishlistPage() {
  useDocumentTitle('Wishlist');
  const { wishlistIds } = useApp();
  const { data, error, loading } = useApi(() => unwrap(api.GET('/wishlist')), [wishlistIds.length]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorAlert error={error} />;
  const items = (data?.items ?? []).filter((i) => wishlistIds.includes(i.product.id));

  return (
    <>
      <h1 className="h3 mb-3">Wishlist</h1>
      {items.length === 0 ? (
        <EmptyState title="Your wishlist is empty">
          <p>Tap the heart on any product to save it for later.</p>
        </EmptyState>
      ) : (
        <ProductGrid products={items.map((i) => i.product)} />
      )}
    </>
  );
}
