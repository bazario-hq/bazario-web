import { useState, type FormEvent } from 'react';
import { Button, Form, Table } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { api, unwrap } from '../../api/client';
import { ErrorAlert, Loading } from '../../components/Feedback';
import { Pager } from '../../components/Pager';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatDateTime } from '../../lib/format';

export function AuditLogPage() {
  useDocumentTitle('Audit log');
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') ?? 1);
  const entityType = params.get('entityType') ?? '';
  const actorId = params.get('actorId') ? Number(params.get('actorId')) : undefined;
  const [entity, setEntity] = useState(entityType);
  const [actor, setActor] = useState(actorId ? String(actorId) : '');
  const { data, error, loading, reload } = useApi(
    () => unwrap(api.GET('/admin/audit-log', { params: { query: { page, pageSize: 25, entityType: entityType || undefined, actorId } } })),
    [page, entityType, actorId],
  );

  function onFilter(e: FormEvent) {
    e.preventDefault();
    const p: Record<string, string> = {};
    if (entity.trim()) p.entityType = entity.trim();
    if (actor.trim()) p.actorId = actor.trim();
    setParams(p);
  }

  return (
    <>
      <h1 className="h3 mb-3">Audit log</h1>
      <Form onSubmit={onFilter} className="d-flex gap-2 mb-3 flex-wrap">
        <Form.Control size="sm" style={{ maxWidth: 200 }} placeholder="Entity type (e.g. product)" aria-label="Entity type" value={entity} onChange={(e) => setEntity(e.target.value)} />
        <Form.Control size="sm" style={{ maxWidth: 140 }} placeholder="Actor id" aria-label="Actor id" inputMode="numeric" value={actor} onChange={(e) => setActor(e.target.value)} />
        <Button size="sm" type="submit" variant="outline-secondary">
          Filter
        </Button>
      </Form>
      {loading && <Loading />}
      {Boolean(error) && <ErrorAlert error={error} onRetry={reload} />}
      {data && !loading && (
        <Table responsive size="sm" className="small">
          <thead>
            <tr>
              <th>When</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Details</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((e) => (
              <tr key={e.id} data-testid="audit-row">
                <td className="text-nowrap">{formatDateTime(e.createdAt)}</td>
                <td>{e.actor?.email ?? 'system'}</td>
                <td>
                  <code>{e.action}</code>
                </td>
                <td>
                  {e.entityType}
                  {e.entityId && ` #${e.entityId}`}
                </td>
                <td>
                  <code className="text-break">{JSON.stringify(e.metadata)}</code>
                </td>
                <td>{e.ip ?? '—'}</td>
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
