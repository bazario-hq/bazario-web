import { Col, Form, Row } from 'react-bootstrap';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api, unwrap } from '../../api/client';
import type { SortOption } from '../../api/types';
import { EmptyState, ErrorAlert, Loading } from '../../components/Feedback';
import { Pager } from '../../components/Pager';
import { ProductGrid } from '../../components/ProductGrid';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { SORT_LABELS } from './sort';

export function CategoryPage() {
  const { slug = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') ?? 1);
  const sort = (params.get('sort') ?? 'popular') as SortOption;

  const category = useApi(() => unwrap(api.GET('/categories/{slug}', { params: { path: { slug } } })), [slug]);
  const products = useApi(
    () => unwrap(api.GET('/products', { params: { query: { category: slug, sort, page, pageSize: 24 } } })),
    [slug, sort, page],
  );
  useDocumentTitle(category.data?.name);

  function update(next: Record<string, string>) {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) p.set(k, v);
    setParams(p);
    window.scrollTo(0, 0);
  }

  if (category.error) return <ErrorAlert error={category.error} />;

  return (
    <>
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item">
            <Link to="/">Home</Link>
          </li>
          {category.data?.breadcrumb.slice(0, -1).map((b) => (
            <li className="breadcrumb-item" key={b.id}>
              <Link to={`/c/${b.slug}`}>{b.name}</Link>
            </li>
          ))}
          {category.data && <li className="breadcrumb-item active">{category.data.name}</li>}
        </ol>
      </nav>
      <Row className="align-items-end mb-3">
        <Col>
          <h1 className="h3 mb-1">{category.data?.name ?? ' '}</h1>
          {category.data?.description && <p className="text-muted mb-0">{category.data.description}</p>}
          {products.data && <div className="small text-muted">{products.data.meta.total.toLocaleString()} products</div>}
        </Col>
        <Col xs="auto">
          <Form.Select size="sm" aria-label="Sort by" value={sort} onChange={(e) => update({ sort: e.target.value, page: '1' })}>
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>
      {category.data && category.data.children.length > 0 && (
        <div className="mb-3 d-flex flex-wrap gap-2">
          {category.data.children.map((c) => (
            <Link key={c.id} to={`/c/${c.slug}`} className="btn btn-sm btn-outline-secondary">
              {c.name}
            </Link>
          ))}
        </div>
      )}
      {products.loading && <Loading />}
      {Boolean(products.error) && <ErrorAlert error={products.error} onRetry={products.reload} />}
      {products.data && !products.loading && (
        <>
          {products.data.items.length === 0 ? (
            <EmptyState title="No products in this category yet" />
          ) : (
            <ProductGrid products={products.data.items} />
          )}
          <Pager page={page} totalPages={products.data.meta.totalPages} onChange={(p) => update({ page: String(p) })} />
        </>
      )}
    </>
  );
}
