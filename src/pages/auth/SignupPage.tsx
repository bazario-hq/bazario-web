import { useState, type FormEvent } from 'react';
import { Alert, Button, Card, Form } from 'react-bootstrap';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { errorMessage } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { safeNext } from './LoginPage';

export function SignupPage() {
  useDocumentTitle('Create an account');
  const { signup, user } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user && !busy) return <Navigate to={next} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signup(name, email, password);
      navigate(next, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Card className="auth-card mx-auto">
      <Card.Body>
        <h1 className="h4 mb-3">Create an account</h1>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={onSubmit}>
          <Form.Group className="mb-3" controlId="name">
            <Form.Label>Name</Form.Label>
            <Form.Control autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3" controlId="email">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3" controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Form.Text>At least 8 characters.</Form.Text>
          </Form.Group>
          <Button type="submit" className="w-100" disabled={busy}>
            Create account
          </Button>
        </Form>
        <div className="small text-center mt-3">
          Already have an account? <Link to={`/login?next=${encodeURIComponent(next)}`}>Log in</Link>
        </div>
      </Card.Body>
    </Card>
  );
}
