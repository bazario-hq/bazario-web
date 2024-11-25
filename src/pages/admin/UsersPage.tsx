import { useState, type FormEvent } from 'react';
import { Button, Form, InputGroup, Table } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { api, errorMessage, unwrap } from '../../api/client';
import type { AdminUser } from '../../api/types';
import { ErrorAlert, Loading } from '../../components/Feedback';
import { Pager } from '../../components/Pager';
import { StatusBadge } from '../../components/StatusBadge';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatDate, fromNow } from '../../lib/format';

type Role = AdminUser['role'];
type Status = AdminUser['status'];

export function UsersPage() {
  useDocumentTitle('Users');
  const { notify, user: me } = useApp();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') ?? 1);
  const q = params.get('q') ?? '';
  const role = (params.get('role') ?? undefined) as Role | undefined;
  const status = (params.get('status') ?? undefined) as Status | undefined;
  const [term, setTerm] = useState(q);
  const { data, error, loading, reload, setData } = useApi(
    () => unwrap(api.GET('/admin/users', { params: { query: { page, pageSize: 25, q: q || undefined, role, status } } })),
    [page, q, role, status],
  );

  function update(next: Record<string, string | undefined>) {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    setParams(p);
  }

  async function patch(u: AdminUser, body: { status?: Status; role?: Role }) {
    try {
      const updated = await unwrap(api.PATCH('/admin/users/{id}', { params: { path: { id: u.id } }, body }));
      if (data) setData({ ...data, items: data.items.map((x) => (x.id === u.id ? updated : x)) });
      notify(`Updated ${updated.email}`);
    } catch (err) {
      notify(errorMessage(err), 'danger');
    }
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    update({ q: term.trim() || undefined, page: undefined });
  }

  return (
    <>
      <h1 className="h3 mb-3">Users</h1>
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <Form onSubmit={onSearch} className="flex-grow-1">
          <InputGroup size="sm">
            <Form.Control placeholder="Search by name or email" aria-label="Search users" value={term} onChange={(e) => setTerm(e.target.value)} />
            <Button type="submit" variant="outline-secondary">
              Search
            </Button>
          </InputGroup>
        </Form>
        <Form.Select size="sm" style={{ width: 'auto' }} aria-label="Role" value={role ?? ''} onChange={(e) => update({ role: e.target.value || undefined, page: undefined })}>
          <option value="">All roles</option>
          <option value="buyer">Buyers</option>
          <option value="seller">Sellers</option>
          <option value="admin">Admins</option>
        </Form.Select>
        <Form.Select size="sm" style={{ width: 'auto' }} aria-label="Status" value={status ?? ''} onChange={(e) => update({ status: e.target.value || undefined, page: undefined })}>
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </Form.Select>
      </div>
      {loading && <Loading />}
      {Boolean(error) && <ErrorAlert error={error} onRetry={reload} />}
      {data && !loading && (
        <Table responsive hover size="sm" className="align-middle">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Last login</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((u) => (
              <tr key={u.id} data-testid="admin-user-row">
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <Form.Select size="sm" aria-label={`Role for ${u.email}`} value={u.role} disabled={u.id === me?.id} onChange={(e) => patch(u, { role: e.target.value as Role })}>
                    <option value="buyer">buyer</option>
                    <option value="seller">seller</option>
                    <option value="admin">admin</option>
                  </Form.Select>
                </td>
                <td>
                  <StatusBadge status={u.status} />
                </td>
                <td>{formatDate(u.createdAt)}</td>
                <td>{u.lastLoginAt ? fromNow(u.lastLoginAt) : '—'}</td>
                <td className="text-end">
                  {u.id !== me?.id &&
                    (u.status === 'active' ? (
                      <Button size="sm" variant="outline-danger" onClick={() => patch(u, { status: 'suspended' })}>
                        Suspend
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline-success" onClick={() => patch(u, { status: 'active' })}>
                        Reactivate
                      </Button>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {data && <Pager page={page} totalPages={data.meta.totalPages} onChange={(p) => update({ page: String(p) })} />}
    </>
  );
}
