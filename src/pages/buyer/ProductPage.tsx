import { useEffect, useState } from 'react';
import { Badge, Col, Row, Table } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { api, unwrap } from '../../api/client';
import { ErrorAlert, Loading } from '../../components/Feedback';
import { ImageGallery } from '../../components/ImageGallery';
import { Price } from '../../components/Price';
import { AddToCartButton, WishlistButton } from '../../components/ProductActions';
import { ProductGrid } from '../../components/ProductGrid';
import { QuantityStepper } from '../../components/QuantityStepper';
import { Rating } from '../../components/Rating';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { rememberViewed } from '../../lib/recently-viewed';
import { ReviewsSection } from './ReviewsSection';

export function ProductPage() {
  const { id } = useParams();
  const productId = Number(id);
  const { data: product, error, loading, reload } = useApi(
    () => unwrap(api.GET('/products/{id}', { params: { path: { id: productId } } })),
    [productId],
  );
  const [quantity, setQuantity] = useState(1);
  useDocumentTitle(product?.name);

  useEffect(() => {
    setQuantity(1);
    window.scrollTo(0, 0);
  }, [productId]);

  useEffect(() => {
    if (product) {
      rememberViewed(product);
    }
  }, [product?.id]);

  if (loading && product?.id !== productId) return <Loading />;
  if (error || !product) return <ErrorAlert error={error} onRetry={reload} />;

  return (
    <>
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item">
            <Link to="/">Home</Link>
          </li>
          {product.breadcrumb.map((b) => (
            <li className="breadcrumb-item" key={b.id}>
              <Link to={`/c/${b.slug}`}>{b.name}</Link>
            </li>
          ))}
        </ol>
      </nav>

      <Row className="g-4">
        <Col md={6}>
          <ImageGallery images={product.images} name={product.name} />
        </Col>
        <Col md={6}>
          <h1 className="h3">{product.name}</h1>
          <div className="mb-2">
            <Rating avg={product.ratingAvg} count={product.ratingCount} />
          </div>
          <div className="mb-3 small">
            Sold by{' '}
            <Link to={`/s/${product.seller.slug}`} data-testid="seller-link">
              {product.seller.storeName}
            </Link>
            {product.seller.ratingAvg != null && <span className="text-muted"> · seller rating {product.seller.ratingAvg.toFixed(1)}</span>}
          </div>
          <div className="h4 mb-3" data-testid="product-price">
            <Price cents={product.priceCents} compareAt={product.compareAtCents} currency={product.currency} />
          </div>
          <div className="mb-3">
            {product.stock > 0 ? (
              <Badge bg={product.stock <= 5 ? 'warning' : 'success'} text={product.stock <= 5 ? 'dark' : undefined}>
                {product.stock <= 5 ? `Only ${product.stock} left` : 'In stock'}
              </Badge>
            ) : (
              <Badge bg="secondary">Out of stock</Badge>
            )}
          </div>
          <div className="d-flex gap-2 align-items-center mb-4">
            {product.stock > 0 && <QuantityStepper value={quantity} max={product.stock} onChange={setQuantity} />}
            <AddToCartButton productId={product.id} stock={product.stock} quantity={quantity} />
            <WishlistButton productId={product.id} />
          </div>
          <div className="product-description mb-4">
            {product.description.split(/\n{2,}/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </Col>
      </Row>

      <Row className="mt-5 g-4">
        <Col md={4}>
          <h2 className="h5">Customer ratings</h2>
          <Rating avg={product.ratingAvg} count={product.ratingCount} />
        </Col>
        <Col md={8}>
          <ReviewsSection productId={product.id} onChanged={reload} />
        </Col>
      </Row>

      {product.related.length > 0 && (
        <section className="mt-5">
          <h2 className="h5 mb-3">You might also like</h2>
          <ProductGrid products={product.related} />
        </section>
      )}
    </>
  );
}
