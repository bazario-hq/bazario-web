import { useState } from 'react';
import { Alert, Button, Form, Modal, Table } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import { api, errorMessage, unwrap } from '../../api/client';
import type { InventoryRow } from '../../api/types';
import { EmptyState, ErrorAlert, Loading } from '../../components/Feedback';
import { Icon } from '../../components/Icon';
import { Pager } from '../../components/Pager';
import { StatusBadge } from '../../components/StatusBadge';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatDateTime } from '../../lib/format';

function HistoryModal({ row, onClose }: { row: InventoryRow; onClose: () => void }) {
  const { data, error, loading } = useApi(
    () => unwrap(api.GET('/seller/inventory/{productId}/history', { params: { path: { productId: row.productId } } })),
    [row.productId],
  );
  return (
    <Modal show onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="h5">Stock history · {row.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading && <Loading />}
        {Boolean(error) && <ErrorAlert error={error} />}
        {data && (
          <Table size="sm">
            <thead>
              <tr>
                <th>When</th>
                <th>Reason</th>
                <th className="text-end">Change</th>
                <th className="text-end">Stock after</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((a) => (
                <tr key={a.id}>
                  <td>{formatDateTime(a.createdAt)}</td>
                  <td>{a.reason}</td>
                  <td className={`text-end ${a.delta < 0 ? 'text-danger' : 'text-success'}`}>
                    {a.delta > 0 ? '+' : ''}
                    {a.delta}
                  </td>
                  <td className="text-end">{a.stockAfter}</td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-muted">
                    No adjustments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </Modal.Body>
    </Modal>
  );
}

export function InventoryPage() {
  useDocumentTitle('Inventory');
  const { notify } = useApp();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') ?? 1);
  const lowStock = params.get('lowStock') === 'true';
  const pageSize = Number(params.get('pageSize') ?? 50);
  const { data, error, loading, reload } = useApi(
    () => unwrap(api.GET('/seller/inventory', { params: { query: { page, pageSize, lowStock: lowStock ? 'true' : undefined } } })),
    [page, lowStock, pageSize],
  );
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [history, setHistory] = useState<InventoryRow | null>(null);

  const changed = (data?.items ?? []).filter((r) => edits[r.productId] !== undefined && edits[r.productId] !== String(r.stock));

  function update(next: Record<string, string | undefined>) {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    setEdits({});
    setParams(p);
  }

  async function save() {
    const items = changed.map((r) => ({ productId: r.productId, stock: Number(edits[r.productId]) }));
    if (items.some((i) => !Number.isInteger(i.stock) || i.stock < 0)) {
      setSaveError('Stock must be a whole number of 0 or more');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const res = await unwrap(api.POST('/seller/inventory/bulk', { body: { items, reason: reason || undefined } }));
      notify(`Updated stock for ${res.updated} product${res.updated === 1 ? '' : 's'}`);
      setEdits({});
      setReason('');
      reload();
    } catch (err) {
      setSaveError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h1 className="h3 mb-0">Inventory</h1>
        <div className="d-flex gap-3 align-items-center">
          <Form.Check type="switch" id="low-stock-only" label="Low stock only" checked={lowStock} onChange={(e) => update({ lowStock: e.target.checked ? 'true' : undefined, page: undefined })} />
          <Form.Select size="sm" style={{ width: 'auto' }} aria-label="Rows per page" value={pageSize} onChange={(e) => update({ pageSize: e.target.value, page: undefined })}>
            {[20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} per page
              </option>
            ))}
          </Form.Select>
        </div>
      </div>
      {saveError && <Alert variant="danger">{saveError}</Alert>}
      {loading && <Loading />}
      {Boolean(error) && <ErrorAlert error={error} onRetry={reload} />}
      {data && !loading && data.items.length === 0 && <EmptyState title={lowStock ? 'Nothing is running low' : 'No products yet'} />}
      {data && !loading && data.items.length > 0 && (
        <Table responsive className="align-middle inventory-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Status</th>
              <th className="text-end">Alert at</th>
              <th style={{ width: 140 }}>Stock</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((r) => (
              <tr key={r.productId} className={r.lowStock ? 'table-warning' : ''} data-testid="inventory-row">
                <td>
                  <Link to={`/seller/products/${r.productId}`}>{r.name}</Link>
                </td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
                <td className="text-end">{r.lowStockThreshold}</td>
                <td>
                  <Form.Control
                    size="sm"
                    type="number"
                    min={0}
                    aria-label={`Stock for ${r.name}`}
                    value={edits[r.productId] ?? String(r.stock)}
                    onChange={(e) => setEdits((prev) => ({ ...prev, [r.productId]: e.target.value }))}
                  />
                </td>
                <td className="text-end">
                  <Button variant="link" size="sm" onClick={() => setHistory(r)} aria-label={`History for ${r.name}`}>
                    <Icon name="history" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {changed.length > 0 && (
        <div className="sticky-bottom bg-body border-top py-2 d-flex gap-2 align-items-center">
          <span className="small">{changed.length} unsaved change(s)</span>
          <Form.Control size="sm" style={{ maxWidth: 260 }} placeholder="Reason (optional)" aria-label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          <Button size="sm" onClick={save} disabled={saving}>
            Save stock
          </Button>
          <Button size="sm" variant="link" onClick={() => setEdits({})}>
            Discard
          </Button>
        </div>
      )}
      {data && <Pager page={page} totalPages={data.meta.totalPages} onChange={(p) => update({ page: String(p) })} />}
      {history && <HistoryModal row={history} onClose={() => setHistory(null)} />}
    </>
  );
}
