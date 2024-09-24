import { Card, Col, Row } from 'react-bootstrap';
import { useParams, useSearchParams } from 'react-router-dom';
import { api, unwrap } from '../../api/client';
import { EmptyState, ErrorAlert, Loading } from '../../components/Feedback';
import { Icon } from '../../components/Icon';
import { Pager } from '../../components/Pager';
import { ProductGrid } from '../../components/ProductGrid';
import { Stars } from '../../components/Rating';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatDate, formatNumber } from '../../lib/format';

export function StorefrontPage() {
  const { slug = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') ?? 1);
  const store = useApi(() => unwrap(api.GET('/sellers/{slug}', { params: { path: { slug } } })), [slug]);
  const products = useApi(
    () => unwrap(api.GET('/products', { params: { query: { seller: slug, sort: 'popular', page, pageSize: 24 } } })),
    [slug, page],
  );
  useDocumentTitle(store.data?.storeName);

  if (store.loading) return <Loading />;
  if (store.error || !store.data) return <ErrorAlert error={store.error} />;
  const s = store.data;

  return (
    <>
      <Card className="mb-4 storefront-header">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={8}>
              <h1 className="h3 mb-1">
                <Icon name="store" className="me-2 text-accent" />
                {s.storeName}
              </h1>
              {s.description && <p className="mb-1">{s.description}</p>}
              <div className="small text-muted">On Bazario since {formatDate(s.memberSince)}</div>
            </Col>
            <Col md={4} className="text-md-end small">
              <div>{formatNumber(s.stats.productCount)} products</div>
              <div>{formatNumber(s.stats.unitsSold)} sold</div>
              {s.stats.ratingAvg != null && (
                <div>
                  <Stars value={s.stats.ratingAvg} /> {s.stats.ratingAvg.toFixed(1)} ({formatNumber(s.stats.reviewCount)} reviews)
                </div>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>
      {products.loading && <Loading />}
      {products.data && !products.loading && (
        <>
          {products.data.items.length === 0 ? <EmptyState title="This store has no products yet" /> : <ProductGrid products={products.data.items} />}
          <Pager page={page} totalPages={products.data.meta.totalPages} onChange={(p) => setParams({ page: String(p) })} />
        </>
      )}
    </>
  );
}
