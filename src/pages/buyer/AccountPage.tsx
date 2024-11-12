import { useState, type FormEvent } from 'react';
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { api, errorMessage, unwrap } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatDate } from '../../lib/format';

export function AccountPage() {
  useDocumentTitle('Account');
  const { user, reloadUser, notify } = useApp();
  const [name, setName] = useState(user?.name ?? '');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  async function saveName(e: FormEvent) {
    e.preventDefault();
    try {
      await unwrap(api.PATCH('/auth/me', { body: { name } }));
      await reloadUser();
      notify('Profile updated');
    } catch (err) {
      notify(errorMessage(err), 'danger');
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await unwrap(api.POST('/auth/password', { body: { currentPassword: current, newPassword: next } }));
      setCurrent('');
      setNext('');
      notify('Password changed');
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <h1 className="h3 mb-3">Account</h1>
      <Row className="g-4">
        <Col md={6}>
          <Card>
            <Card.Body>
              <h2 className="h5">Profile</h2>
              <p className="small text-muted">
                {user.email} · member since {formatDate(user.createdAt)}
              </p>
              <Form onSubmit={saveName}>
                <Form.Group className="mb-3" controlId="account-name">
                  <Form.Label>Name</Form.Label>
                  <Form.Control value={name} onChange={(e) => setName(e.target.value)} required />
                </Form.Group>
                <Button type="submit">Save</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Body>
              <h2 className="h5">Change password</h2>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={changePassword}>
                <Form.Group className="mb-3" controlId="current-password">
                  <Form.Label>Current password</Form.Label>
                  <Form.Control type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
                </Form.Group>
                <Form.Group className="mb-3" controlId="new-password">
                  <Form.Label>New password</Form.Label>
                  <Form.Control type="password" value={next} onChange={(e) => setNext(e.target.value)} minLength={8} required />
                </Form.Group>
                <Button type="submit">Change password</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}
