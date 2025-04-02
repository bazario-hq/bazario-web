import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Col, Form, Row } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { api, unwrap } from '../../api/client';
import type { ProductCard, ProductSearchResponse, SortOption } from '../../api/types';
import { EmptyState, ErrorAlert, Loading } from '../../components/Feedback';
import { ProductGrid } from '../../components/ProductGrid';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatMoney } from '../../lib/format';
import { SORT_LABELS } from './sort';

const PAGE_SIZE = 24;
const PRICE_MAX_CENTS = 50_000;

function readFilters(params: URLSearchParams) {
  const num = (k: string) => (params.get(k) ? Number(params.get(k)) : undefined);
  return {
    q: params.get('q') ?? '',
    category: params.get('category') ?? undefined,
    minPrice: num('minPrice'),
    maxPrice: num('maxPrice'),
    minRating: num('minRating'),
    inStock: params.get('inStock') === 'true' ? ('true' as const) : undefined,
    sort: (params.get('sort') ?? 'newest') as SortOption,
  };
}

async function search(params: URLSearchParams, page: number) {
  const f = readFilters(params);
  return unwrap(
    api.GET('/products', {
      params: { query: { ...f, q: f.q || undefined, page, pageSize: PAGE_SIZE } },
    }),
  );
}

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  useDocumentTitle(filters.q ? `“${filters.q}”` : 'All products');

  const [items, setItems] = useState<ProductCard[]>([]);
  const [meta, setMeta] = useState<ProductSearchResponse['meta'] | null>(null);
  const [facets, setFacets] = useState<ProductSearchResponse['facets']['categories']>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const loadingMore = useRef(false);

  const key = params.toString();

  useEffect(() => {
    setLoading(true);
    setError(null);
    search(params, 1)
      .then((res) => {
        setItems(res.items);
        setMeta(res.meta);
        setFacets(res.facets.categories);
        setPage(1);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [key]);

  const hasMore = meta != null && items.length < meta.total;

  const loadMore = () => {
    if (loadingMore.current || !hasMore) return;
    loadingMore.current = true;
    search(params, page + 1)
      .then((res) => {
        setItems((prev) => [...prev, ...res.items]);
        setMeta(res.meta);
        setPage(page + 1);
      })
      .catch(setError)
      .finally(() => {
        loadingMore.current = false;
      });
  };

  function update(next: Record<string, string | undefined>) {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === '') p.delete(k);
      else p.set(k, v);
    }
    setParams(p, { replace: true });
  }

  const activeCategory = facets.find((f) => f.slug === filters.category);

  return (
    <Row>
      <Col lg={3} className="mb-4">
        <aside className="filters" aria-label="Filters">
          <Form.Group className="mb-3" controlId="refine-q">
            <Form.Label className="fw-bold small">Search within results</Form.Label>
            <Form.Control type="search" value={filters.q} placeholder="Keywords" onChange={(e) => update({ q: e.target.value })} />
          </Form.Group>

          <div className="mb-3">
            <div className="fw-bold small mb-1">Category</div>
            {filters.category && (
              <Button variant="link" size="sm" className="p-0 mb-1" onClick={() => update({ category: undefined })}>
                ‹ All categories
              </Button>
            )}
            <ul className="list-unstyled small facet-list">
              {facets.map((f) => (
                <li key={f.id}>
                  <Button
                    variant="link"
                    size="sm"
                    className={`p-0 text-start ${f.slug === filters.category ? 'fw-bold' : ''}`}
                    onClick={() => update({ category: f.slug })}
                  >
                    {f.name}
                  </Button>{' '}
                  <Badge bg="light" text="dark">
                    {f.count}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>

          <Form.Group className="mb-3">
            <div className="fw-bold small mb-1">Price</div>
            <Form.Label className="small mb-0" htmlFor="min-price">
              Min: {formatMoney(filters.minPrice ?? 0)}
            </Form.Label>
            <Form.Range
              id="min-price"
              min={0}
              max={PRICE_MAX_CENTS}
              step={500}
              value={filters.minPrice ?? 0}
              onChange={(e) => update({ minPrice: e.target.value })}
            />
            <Form.Label className="small mb-0" htmlFor="max-price">
              Max: {filters.maxPrice != null ? formatMoney(filters.maxPrice) : 'Any'}
            </Form.Label>
            <Form.Range
              id="max-price"
              min={0}
              max={PRICE_MAX_CENTS}
              step={500}
              value={filters.maxPrice ?? PRICE_MAX_CENTS}
              onChange={(e) => update({ maxPrice: e.target.value === String(PRICE_MAX_CENTS) ? undefined : e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <div className="fw-bold small mb-1">Rating</div>
            {[4, 3, 2].map((r) => (
              <Form.Check
                key={r}
                type="radio"
                name="minRating"
                id={`rating-${r}`}
                label={`${r}★ & up`}
                checked={filters.minRating === r}
                onChange={() => update({ minRating: String(r) })}
              />
            ))}
            <Form.Check type="radio" name="minRating" id="rating-any" label="Any" checked={filters.minRating == null} onChange={() => update({ minRating: undefined })} />
          </Form.Group>

          <Form.Check
            type="switch"
            id="in-stock"
            label="In stock only"
            checked={filters.inStock === 'true'}
            onChange={(e) => update({ inStock: e.target.checked ? 'true' : undefined })}
          />
        </aside>
      </Col>

      <Col lg={9}>
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div>
            <h1 className="h4 mb-0">{filters.q ? `Results for “${filters.q}”` : activeCategory ? activeCategory.name : 'All products'}</h1>
            {meta && (
              <div className="small text-muted" data-testid="result-count">
                {meta.total.toLocaleString()} result{meta.total === 1 ? '' : 's'}
              </div>
            )}
          </div>
          <Form.Select size="sm" style={{ width: 'auto' }} aria-label="Sort by" value={filters.sort} onChange={(e) => update({ sort: e.target.value })}>
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Form.Select>
        </div>

        {Boolean(error) && <ErrorAlert error={error} />}
        {loading && items.length === 0 && <Loading />}
        {!loading && meta && items.length === 0 && (
          <EmptyState title="No products match your search">
            <p>Try fewer filters or a different keyword.</p>
          </EmptyState>
        )}
        {items.length > 0 && <ProductGrid products={items} />}
        {hasMore && (
          <div className="text-center my-4">
            <Button variant="outline-primary" onClick={loadMore}>
              Load more
            </Button>
          </div>
        )}
      </Col>
    </Row>
  );
}
