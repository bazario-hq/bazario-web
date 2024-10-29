import { Form, Table } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import { api, unwrap } from '../../api/client';
import { EmptyState, ErrorAlert, Loading } from '../../components/Feedback';
import { Pager } from '../../components/Pager';
import { StatusBadge } from '../../components/StatusBadge';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatDateTime, formatMoney } from '../../lib/format';

type Status = 'pending' | 'shipped' | 'delivered' | 'cancelled';

export function SellerOrdersPage() {
  useDocumentTitle('Orders');
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') ?? 1);
  const status = (params.get('status') ?? undefined) as Status | undefined;
  const { data, error, loading, reload } = useApi(
    () => unwrap(api.GET('/seller/orders', { params: { query: { page, pageSize: 20, status } } })),
    [page, status],
  );

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Orders</h1>
        <Form.Select size="sm" style={{ width: 'auto' }} aria-label="Fulfilment status" value={status ?? ''} onChange={(e) => setParams(e.target.value ? { status: e.target.value } : {})}>
          <option value="">All orders</option>
          <option value="pending">To ship</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </Form.Select>
      </div>
      {loading && <Loading />}
      {Boolean(error) && <ErrorAlert error={error} onRetry={reload} />}
      {data && !loading && data.items.length === 0 && <EmptyState title="No orders here" />}
      {data && !loading && data.items.length > 0 && (
        <Table hover responsive className="align-middle">
          <thead>
            <tr>
              <th>Order</th>
              <th>Placed</th>
              <th>Buyer</th>
              <th className="text-end">Items</th>
              <th className="text-end">Total</th>
              <th>Fulfilment</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((o) => (
              <tr key={o.orderId} data-testid="seller-order-row">
                <td>
                  <Link to={`/seller/orders/${o.orderId}`}>#{o.orderId}</Link>
                </td>
                <td>{formatDateTime(o.createdAt)}</td>
                <td>{o.buyerName}</td>
                <td className="text-end">{o.itemCount}</td>
                <td className="text-end">{formatMoney(o.totalCents)}</td>
                <td>
                  <StatusBadge status={o.fulfilment} />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {data && (
        <Pager
          page={page}
          totalPages={data.meta.totalPages}
          onChange={(p) => {
            const next = new URLSearchParams(params);
            next.set('page', String(p));
            setParams(next);
          }}
        />
      )}
    </>
  );
}
