import { Card, Col, Form, ListGroup, Row, Table } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, unwrap } from '../../api/client';
import type { SellerDashboard } from '../../api/types';
import { ErrorAlert, Loading } from '../../components/Feedback';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatDate, formatMoney, formatNumber, percentChange } from '../../lib/format';

type Range = '7d' | '30d' | '90d' | 'mtd';
const RANGES: Record<Range, string> = { '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days', mtd: 'Month to date' };

function Kpi({ label, value, current, previous, testId }: { label: string; value: string; current: number; previous: number; testId: string }) {
  const change = percentChange(current, previous);
  return (
    <Card className="h-100 kpi">
      <Card.Body>
        <div className="small text-muted">{label}</div>
        <div className="h4 mb-0" data-testid={testId}>
          {value}
        </div>
        {change != null && (
          <div className={`small ${change >= 0 ? 'text-success' : 'text-danger'}`}>
            {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}% vs previous period
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

function SalesChart({ data }: { data: SellerDashboard['salesByDay'] }) {
  const points = data.map((d) => ({ date: formatDate(d.date), revenue: d.revenueCents / 100, orders: d.orders }));
  return (
    <div style={{ height: 280 }} data-testid="sales-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" minTickGap={24} fontSize={12} />
          <YAxis fontSize={12} tickFormatter={(v) => `$${v}`} />
          <Tooltip formatter={(v: number, name) => (name === 'revenue' ? formatMoney(v * 100) : v)} />
          <Line type="monotone" dataKey="revenue" stroke="#1f3a5f" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DashboardPage() {
  useDocumentTitle('Seller dashboard');
  const [params, setParams] = useSearchParams();
  const range = (params.get('range') ?? '30d') as Range;
  const { data, error, loading, reload } = useApi(() => unwrap(api.GET('/seller/dashboard', { params: { query: { range } } })), [range]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Dashboard</h1>
        <Form.Select size="sm" style={{ width: 'auto' }} aria-label="Date range" value={range} onChange={(e) => setParams({ range: e.target.value })}>
          {Object.entries(RANGES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Form.Select>
      </div>
      {loading && <Loading />}
      {Boolean(error) && <ErrorAlert error={error} onRetry={reload} />}
      {data && !loading && (
        <>
          <Row xs={1} sm={2} xl={4} className="g-3 mb-4">
            <Col>
              <Kpi label="Revenue" testId="kpi-revenue" value={formatMoney(data.kpis.revenueCents)} current={data.kpis.revenueCents} previous={data.previous.revenueCents} />
            </Col>
            <Col>
              <Kpi label="Orders" testId="kpi-orders" value={formatNumber(data.kpis.orders)} current={data.kpis.orders} previous={data.previous.orders} />
            </Col>
            <Col>
              <Kpi label="Units sold" testId="kpi-units" value={formatNumber(data.kpis.units)} current={data.kpis.units} previous={data.previous.units} />
            </Col>
            <Col>
              <Kpi label="Average order" testId="kpi-aov" value={formatMoney(data.kpis.averageOrderCents)} current={data.kpis.averageOrderCents} previous={data.previous.averageOrderCents} />
            </Col>
          </Row>
          <Card className="mb-4">
            <Card.Body>
              <h2 className="h6">Sales</h2>
              <SalesChart data={data.salesByDay} />
            </Card.Body>
          </Card>
          <Row className="g-4">
            <Col lg={7}>
              <Card>
                <Card.Body>
                  <h2 className="h6">Top products</h2>
                  <Table size="sm" className="mb-0">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th className="text-end">Units</th>
                        <th className="text-end">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topProducts.map((p) => (
                        <tr key={p.productId}>
                          <td>
                            <Link to={`/seller/products/${p.productId}`}>{p.name}</Link>
                          </td>
                          <td className="text-end">{formatNumber(p.units)}</td>
                          <td className="text-end">{formatMoney(p.revenueCents)}</td>
                        </tr>
                      ))}
                      {data.topProducts.length === 0 && (
                        <tr>
                          <td colSpan={3} className="text-muted">
                            No sales in this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={5}>
              <Card className="mb-3">
                <Card.Body>
                  <h2 className="h6 mb-0">
                    <Link to="/seller/orders?status=pending">{formatNumber(data.pendingShipments)} orders waiting to ship</Link>
                  </h2>
                </Card.Body>
              </Card>
              <Card>
                <Card.Body>
                  <h2 className="h6">Low stock ({data.lowStock.count})</h2>
                  <ListGroup variant="flush">
                    {data.lowStock.items.map((i) => (
                      <ListGroup.Item key={i.productId} className="d-flex justify-content-between px-0 small">
                        <Link to="/seller/inventory?lowStock=true">{i.name}</Link>
                        <span className="text-danger">{i.stock} left</span>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </>
  );
}
