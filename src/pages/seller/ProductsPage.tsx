import { useState, type FormEvent } from 'react';
import { Button, Form, InputGroup, Table } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import { api, unwrap } from '../../api/client';
import { EmptyState, ErrorAlert, Loading } from '../../components/Feedback';
import { Icon } from '../../components/Icon';
import { Pager } from '../../components/Pager';
import { PLACEHOLDER_IMAGE } from '../../components/placeholder';
import { StatusBadge } from '../../components/StatusBadge';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatMoney, formatNumber } from '../../lib/format';

type Status = 'draft' | 'active' | 'archived';

export function ProductsPage() {
  useDocumentTitle('Products');
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') ?? 1);
  const status = (params.get('status') ?? undefined) as Status | undefined;
  const q = params.get('q') ?? '';
  const [term, setTerm] = useState(q);
  const { data, error, loading, reload } = useApi(
    () => unwrap(api.GET('/seller/products', { params: { query: { page, pageSize: 20, status, q: q || undefined } } })),
    [page, status, q],
  );

  function update(next: Record<string, string | undefined>) {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    setParams(p);
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    update({ q: term.trim() || undefined, page: undefined });
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Products</h1>
        <Link to="/seller/products/new" className="btn btn-primary">
          <Icon name="plus" className="me-1" /> New product
        </Link>
      </div>
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <Form onSubmit={onSearch} className="flex-grow-1">
          <InputGroup size="sm">
            <Form.Control placeholder="Search your products" aria-label="Search your products" value={term} onChange={(e) => setTerm(e.target.value)} />
            <Button type="submit" variant="outline-secondary">
              Search
            </Button>
          </InputGroup>
        </Form>
        <Form.Select size="sm" style={{ width: 'auto' }} aria-label="Status" value={status ?? ''} onChange={(e) => update({ status: e.target.value || undefined, page: undefined })}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </Form.Select>
      </div>
      {loading && <Loading />}
      {Boolean(error) && <ErrorAlert error={error} onRetry={reload} />}
      {data && !loading && data.items.length === 0 && <EmptyState title="No products found" />}
      {data && !loading && data.items.length > 0 && (
        <Table hover responsive className="align-middle">
          <thead>
            <tr>
              <th style={{ width: 64 }}></th>
              <th>Name</th>
              <th>Status</th>
              <th className="text-end">Price</th>
              <th className="text-end">Stock</th>
              <th className="text-end">Sold</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((p) => (
              <tr key={p.id} data-testid="seller-product-row">
                <td>
                  <img src={p.images[0]?.thumbUrl ?? PLACEHOLDER_IMAGE} alt="" width={48} height={48} className="rounded object-fit-cover" />
                </td>
                <td>
                  <Link to={`/seller/products/${p.id}`}>{p.name}</Link>
                </td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
                <td className="text-end">{formatMoney(p.priceCents)}</td>
                <td className={`text-end ${p.stock <= p.lowStockThreshold ? 'text-danger' : ''}`}>{formatNumber(p.stock)}</td>
                <td className="text-end">{formatNumber(p.salesCount)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {data && <Pager page={page} totalPages={data.meta.totalPages} onChange={(p) => update({ page: String(p) })} />}
    </>
  );
}
