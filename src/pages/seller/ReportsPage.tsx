import { useState } from 'react';
import { Button, Card, Col, Form, Row, Table } from 'react-bootstrap';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import moment from 'moment';
import { api, errorMessage } from '../../api/client';
import { ErrorAlert, Loading } from '../../components/Feedback';
import { Icon } from '../../components/Icon';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatDate, formatMoney, formatNumber } from '../../lib/format';
import { buildSalesReport, type SalesReport } from './salesReport';

async function fetchCsv(from: string, to: string) {
  const { data, error, response } = await api.GET('/seller/sales/export.csv', { params: { query: { from, to } }, parseAs: 'text' });
  if (error !== undefined || !response.ok) throw new Error(`Export failed (${response.status})`);
  return data as unknown as string;
}

export function ReportsPage() {
  useDocumentTitle('Reports');
  const [from, setFrom] = useState(moment().subtract(30, 'days').format('YYYY-MM-DD'));
  const [to, setTo] = useState(moment().format('YYYY-MM-DD'));
  const [csv, setCsv] = useState<string | null>(null);
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const text = await fetchCsv(from, to);
      setCsv(text);
      setReport(buildSalesReport(text));
    } catch (err) {
      setError(new Error(errorMessage(err)));
    } finally {
      setLoading(false);
    }
  }

  function download() {
    if (!csv) return;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <h1 className="h3 mb-3">Sales report</h1>
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-2 align-items-end">
            <Col sm={4} md={3}>
              <Form.Group controlId="report-from">
                <Form.Label className="small">From</Form.Label>
                <Form.Control type="date" size="sm" value={from} onChange={(e) => setFrom(e.target.value)} />
              </Form.Group>
            </Col>
            <Col sm={4} md={3}>
              <Form.Group controlId="report-to">
                <Form.Label className="small">To</Form.Label>
                <Form.Control type="date" size="sm" value={to} onChange={(e) => setTo(e.target.value)} />
              </Form.Group>
            </Col>
            <Col sm="auto">
              <Button size="sm" onClick={run} disabled={loading}>
                Run report
              </Button>{' '}
              <Button size="sm" variant="outline-secondary" onClick={download} disabled={!csv}>
                <Icon name="download" className="me-1" /> Download CSV
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading && <Loading label="Building report…" />}
      {Boolean(error) && <ErrorAlert error={error} />}
      {report && !loading && (
        <>
          <Row xs={1} sm={3} className="g-3 mb-4">
            <Col>
              <Card body>
                <div className="small text-muted">Revenue (excl. cancelled)</div>
                <div className="h4 mb-0" data-testid="report-total">
                  {formatMoney(report.totalCents)}
                </div>
              </Card>
            </Col>
            <Col>
              <Card body>
                <div className="small text-muted">Orders</div>
                <div className="h4 mb-0" data-testid="report-orders">
                  {formatNumber(report.orders)}
                </div>
              </Card>
            </Col>
            <Col>
              <Card body>
                <div className="small text-muted">Units</div>
                <div className="h4 mb-0">{formatNumber(report.units)}</div>
              </Card>
            </Col>
          </Row>
          <Card className="mb-4">
            <Card.Body>
              <h2 className="h6">Revenue by day</h2>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.byDay.map((d) => ({ date: formatDate(d.date), revenue: d.revenueCents / 100 }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} minTickGap={24} />
                    <YAxis fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(v: number) => formatMoney(v * 100)} />
                    <Bar dataKey="revenue" fill="#1f3a5f" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
          <Row className="g-4">
            <Col lg={8}>
              <h2 className="h6">By product</h2>
              <Table size="sm" responsive>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="text-end">Units</th>
                    <th className="text-end">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {report.byProduct.map((p) => (
                    <tr key={p.productId}>
                      <td>{p.name}</td>
                      <td className="text-end">{formatNumber(p.units)}</td>
                      <td className="text-end">{formatMoney(p.revenueCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Col>
            <Col lg={4}>
              <h2 className="h6">By country</h2>
              <Table size="sm">
                <thead>
                  <tr>
                    <th>Country</th>
                    <th className="text-end">Orders</th>
                    <th className="text-end">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {report.byCountry.map((c) => (
                    <tr key={c.country}>
                      <td>{c.country}</td>
                      <td className="text-end">{c.orders}</td>
                      <td className="text-end">{formatMoney(c.revenueCents)}</td>
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
