import { Card, Table } from 'react-bootstrap';
import { api, unwrap } from '../../api/client';
import { ErrorAlert, Loading } from '../../components/Feedback';
import { StatusBadge } from '../../components/StatusBadge';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatDate, formatMoney, formatMonth } from '../../lib/format';

export function PayoutsPage() {
  useDocumentTitle('Payouts');
  const { data, error, loading, reload } = useApi(() => unwrap(api.GET('/seller/payouts')));

  if (loading) return <Loading />;
  if (error || !data) return <ErrorAlert error={error} onRetry={reload} />;

  return (
    <>
      <h1 className="h3 mb-3">Payouts</h1>
      <p className="text-muted small">Bazario keeps a {data.feePercent}% platform fee. Payouts are made monthly for delivered and shipped orders.</p>
      <Card>
        <Table responsive className="mb-0 align-middle">
          <thead>
            <tr>
              <th>Month</th>
              <th className="text-end">Gross</th>
              <th className="text-end">Fee</th>
              <th className="text-end">Net</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.months.map((m) => (
              <tr key={m.month} data-testid="payout-row">
                <td>{formatMonth(m.month)}</td>
                <td className="text-end">{formatMoney(m.grossCents)}</td>
                <td className="text-end">{formatMoney(m.feeCents)}</td>
                <td className="text-end fw-bold">{formatMoney(m.netCents)}</td>
                <td>
                  <StatusBadge status={m.status} />
                  {m.paidAt && <span className="small text-muted ms-2">{formatDate(m.paidAt)}</span>}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="fw-bold">
              <td>Total</td>
              <td className="text-end">{formatMoney(data.totals.grossCents)}</td>
              <td className="text-end">{formatMoney(data.totals.feeCents)}</td>
              <td className="text-end" data-testid="payout-net-total">
                {formatMoney(data.totals.netCents)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </Table>
      </Card>
    </>
  );
}
