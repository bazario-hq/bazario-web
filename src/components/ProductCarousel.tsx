import { memo } from 'react';
import { Link } from 'react-router-dom';
import _ from 'lodash';
import type { ProductCard as ProductCardData } from '../api/types';
import { Icon, type IconName } from './Icon';
import { ProductCard } from './ProductCard';

interface Props {
  title: string;
  icon: IconName;
  products: ProductCardData[];
  moreLink?: string;
}

function ProductCarouselInner({ title, icon, products, moreLink }: Props) {
  if (products.length === 0) return null;
  return (
    <section className="mb-5 product-carousel" aria-label={title}>
      <div className="d-flex align-items-baseline justify-content-between mb-2">
        <h2 className="h4 mb-0">
          <Icon name={icon} className="me-2 text-accent" />
          {title}
        </h2>
        {moreLink && (
          <Link to={moreLink} className="small">
            See all
          </Link>
        )}
      </div>
      <div className="carousel-track">
        {products.map((p) => (
          <div className="carousel-item-card" key={p.id}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

// Carousels hold a dozen cards each; skip re-rendering them when their products are unchanged.
export const ProductCarousel = memo(ProductCarouselInner, _.isEqual);
