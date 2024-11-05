import { useState, type FormEvent } from 'react';
import { Alert, Button, Card, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { api, errorMessage, unwrap } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { useApp } from '../../context/AppContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function SellApplyPage() {
  useDocumentTitle('Sell on Bazario');
  const { user, reloadUser } = useApp();
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) {
    return (
      <Card className="auth-card mx-auto">
        <Card.Body>
          <h1 className="h4">Sell on Bazario</h1>
          <p>Reach thousands of shoppers. Create an account or log in to apply.</p>
          <Link to="/login?next=/sell" className="btn btn-primary">
            Log in to apply
          </Link>
        </Card.Body>
      </Card>
    );
  }

  if (user.seller) {
    return (
      <Card className="auth-card mx-auto">
        <Card.Body>
          <h1 className="h4">{user.seller.storeName}</h1>
          <p>
            Application status: <StatusBadge status={user.seller.status} />
          </p>
          {user.seller.status === 'pending' && <p className="mb-0">We review new sellers within two working days. We'll notify you when your store is approved.</p>}
          {user.seller.status === 'active' && <Link to="/seller">Go to your seller dashboard</Link>}
          {user.seller.status === 'suspended' && <p className="mb-0">Your store is suspended. Please contact seller support.</p>}
        </Card.Body>
      </Card>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await unwrap(api.POST('/sellers/apply', { body: { storeName, description: description || undefined, supportEmail: supportEmail || undefined } }));
      await reloadUser();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="auth-card mx-auto">
      <Card.Body>
        <h1 className="h4 mb-3">Open your store</h1>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={onSubmit}>
          <Form.Group className="mb-3" controlId="storeName">
            <Form.Label>Store name</Form.Label>
            <Form.Control value={storeName} onChange={(e) => setStoreName(e.target.value)} required minLength={2} />
          </Form.Group>
          <Form.Group className="mb-3" controlId="description">
            <Form.Label>What do you sell?</Form.Label>
            <Form.Control as="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-3" controlId="supportEmail">
            <Form.Label>Support email (optional)</Form.Label>
            <Form.Control type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
          </Form.Group>
          <Button type="submit" disabled={busy}>
            Submit application
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}
