import { Button, Form, Table } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import { api, errorMessage, unwrap } from '../../api/client';
import type { AdminSeller } from '../../api/types';
import { EmptyState, ErrorAlert, Loading } from '../../components/Feedback';
import { Pager } from '../../components/Pager';
import { StatusBadge } from '../../components/StatusBadge';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatDate, formatNumber } from '../../lib/format';

type Status = AdminSeller['status'];

export function SellersPage() {
  useDocumentTitle('Sellers');
  const { notify } = useApp();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') ?? 1);
  const status = (params.get('status') ?? undefined) as Status | undefined;
  const { data, error, loading, reload } = useApi(
    () => unwrap(api.GET('/admin/sellers', { params: { query: { page, pageSize: 25, status } } })),
    [page, status],
  );

  async function setStatus(s: AdminSeller, next: Status) {
    try {
      await unwrap(api.PATCH('/admin/sellers/{id}', { params: { path: { id: s.id } }, body: { status: next } }));
      notify(`${s.storeName} is now ${next}`);
      reload();
    } catch (err) {
      notify(errorMessage(err), 'danger');
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Sellers</h1>
        <Form.Select size="sm" style={{ width: 'auto' }} aria-label="Status" value={status ?? ''} onChange={(e) => setParams(e.target.value ? { status: e.target.value } : {})}>
          <option value="">All sellers</option>
          <option value="pending">Pending approval</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </Form.Select>
      </div>
      {loading && <Loading />}
      {Boolean(error) && <ErrorAlert error={error} onRetry={reload} />}
      {data && !loading && data.items.length === 0 && <EmptyState title="No sellers here" />}
      {data && !loading && data.items.length > 0 && (
        <Table responsive hover size="sm" className="align-middle">
          <thead>
            <tr>
              <th>Store</th>
              <th>Owner</th>
              <th className="text-end">Products</th>
              <th>Status</th>
              <th>Applied</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((s) => (
              <tr key={s.id} data-testid="admin-seller-row">
                <td>{s.status === 'active' ? <Link to={`/s/${s.slug}`}>{s.storeName}</Link> : s.storeName}</td>
                <td className="small">
                  {s.ownerName}
                  <br />
                  <span className="text-muted">{s.ownerEmail}</span>
                </td>
                <td className="text-end">{formatNumber(s.productCount)}</td>
                <td>
                  <StatusBadge status={s.status} />
                </td>
                <td>{formatDate(s.createdAt)}</td>
                <td className="text-end text-nowrap">
                  {s.status !== 'active' && (
                    <Button size="sm" variant="outline-success" onClick={() => setStatus(s, 'active')}>
                      {s.status === 'pending' ? 'Approve' : 'Reactivate'}
                    </Button>
                  )}{' '}
                  {s.status !== 'suspended' && (
                    <Button size="sm" variant="outline-danger" onClick={() => setStatus(s, 'suspended')}>
                      Suspend
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {data && <Pager page={page} totalPages={data.meta.totalPages} onChange={(p) => setParams({ ...(status ? { status } : {}), page: String(p) })} />}
    </>
  );
}
