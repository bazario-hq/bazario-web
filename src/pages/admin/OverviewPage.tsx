import { Card, Col, Form, Row, Table } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, unwrap } from '../../api/client';
import { ErrorAlert, Loading } from '../../components/Feedback';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatMoney, formatMonth, formatNumber } from '../../lib/format';

export function OverviewPage() {
  useDocumentTitle('Admin');
  const [params, setParams] = useSearchParams();
  const months = Number(params.get('months') ?? 12);
  const { data, error, loading, reload } = useApi(() => unwrap(api.GET('/admin/reports/overview', { params: { query: { months } } })), [months]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Platform overview</h1>
        <Form.Select size="sm" style={{ width: 'auto' }} aria-label="Period" value={months} onChange={(e) => setParams({ months: e.target.value })}>
          {[3, 6, 12, 24].map((m) => (
            <option key={m} value={m}>
              Last {m} months
            </option>
          ))}
        </Form.Select>
      </div>
      {loading && <Loading />}
      {Boolean(error) && <ErrorAlert error={error} onRetry={reload} />}
      {data && !loading && (
        <>
          <Row xs={2} md={5} className="g-3 mb-4">
            {[
              ['GMV', formatMoney(data.totals.gmvCents), 'gmv'],
              ['Orders', formatNumber(data.totals.orders), 'orders'],
              ['Users', formatNumber(data.totals.users), 'users'],
              ['Active products', formatNumber(data.totals.activeProducts), 'products'],
              ['Active sellers', formatNumber(data.totals.activeSellers), 'sellers'],
            ].map(([label, value, id]) => (
              <Col key={id}>
                <Card body>
                  <div className="small text-muted">{label}</div>
                  <div className="h5 mb-0" data-testid={`total-${id}`}>
                    {value}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          <Card className="mb-4">
            <Card.Body>
              <h2 className="h6">GMV by month</h2>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.months.map((m) => ({ month: formatMonth(m.month), gmv: m.gmvCents / 100 }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(v) => `$${formatNumber(v)}`} />
                    <Tooltip formatter={(v: number) => formatMoney(v * 100)} />
                    <Bar dataKey="gmv" fill="#1f3a5f" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
          <Row className="g-4">
            <Col lg={7}>
              <h2 className="h6">Monthly</h2>
              <Table size="sm" responsive>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th className="text-end">Orders</th>
                    <th className="text-end">GMV</th>
                    <th className="text-end">Buyers</th>
                    <th className="text-end">Sign-ups</th>
                  </tr>
                </thead>
                <tbody>
                  {data.months.map((m) => (
                    <tr key={m.month}>
                      <td>{formatMonth(m.month)}</td>
                      <td className="text-end">{formatNumber(m.orders)}</td>
                      <td className="text-end">{formatMoney(m.gmvCents)}</td>
                      <td className="text-end">{formatNumber(m.buyers)}</td>
                      <td className="text-end">{formatNumber(m.signups)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Col>
            <Col lg={5}>
              <h2 className="h6">Top sellers</h2>
              <Table size="sm">
                <thead>
                  <tr>
                    <th>Store</th>
                    <th className="text-end">Orders</th>
                    <th className="text-end">GMV</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topSellers.map((s) => (
                    <tr key={s.sellerId}>
                      <td>{s.storeName}</td>
                      <td className="text-end">{formatNumber(s.orders)}</td>
                      <td className="text-end">{formatMoney(s.gmvCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Col>
          </Row>
        </>
      )}
    </>
  );
}
