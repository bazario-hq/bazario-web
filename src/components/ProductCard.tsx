import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import type { ProductCard as ProductCardData } from '../api/types';
import { useApp } from '../context/AppContext';
import { useWindowWidth } from '../hooks/useWindowWidth';
import { categoryPath } from '../lib/categories';
import { PLACEHOLDER_IMAGE } from './placeholder';
import { Price } from './Price';
import { AddToCartButton, WishlistButton } from './ProductActions';
import { Rating } from './Rating';

export function productUrl(p: { id: number; slug: string }) {
  return `/p/${p.id}/${p.slug}`;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const { categories } = useApp();
  const width = useWindowWidth();
  const compact = width < 576;
  const path = categoryPath(categories, product.categoryId);
  const category = path[path.length - 1];

  return (
    <Card className="product-card h-100" data-product-card data-product-id={product.id}>
      <Link to={productUrl(product)} className="product-card-image">
        <img src={product.image?.largeUrl ?? PLACEHOLDER_IMAGE} alt={product.image?.altText ?? product.name} className="card-img-top" />
      </Link>
      <Card.Body className="d-flex flex-column">
        {category && <div className="text-muted small text-truncate">{category.name}</div>}
        <Card.Title as="h3" className="h6 mb-1 product-card-title">
          <Link to={productUrl(product)} className="stretched-link-off text-reset text-decoration-none">
            {product.name}
          </Link>
        </Card.Title>
        {!compact && <p className="product-card-description text-muted small mb-2">{product.description}</p>}
        <div className="mb-1">
          <Rating avg={product.ratingAvg} count={product.ratingCount} />
        </div>
        <div className="mt-auto d-flex align-items-center justify-content-between">
          <Price cents={product.priceCents} compareAt={product.compareAtCents} currency={product.currency} />
          <span className="small text-muted text-truncate ms-2">{product.seller.storeName}</span>
        </div>
      </Card.Body>
      <Card.Footer className="bg-transparent border-0 pt-0 d-flex gap-2">
        <div className="flex-grow-1">
          <AddToCartButton productId={product.id} stock={product.stock} size="sm" block />
        </div>
        <WishlistButton productId={product.id} size="sm" />
      </Card.Footer>
    </Card>
  );
}
