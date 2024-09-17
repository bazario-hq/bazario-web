import { Col, Row } from 'react-bootstrap';
import type { ProductCard as ProductCardData } from '../api/types';
import { ProductCard } from './ProductCard';

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <Row xs={2} md={3} lg={4} className="g-3 product-grid">
      {products.map((p, i) => (
        <Col key={i}>
          <ProductCard product={p} />
        </Col>
      ))}
    </Row>
  );
}
