import { useEffect, useState, type FormEvent } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { api, errorMessage, unwrap } from '../../api/client';
import { ErrorAlert, Loading } from '../../components/Feedback';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function ProfilePage() {
  useDocumentTitle('Store profile');
  const { notify, reloadUser } = useApp();
  const { data, error, loading } = useApi(() => unwrap(api.GET('/seller/profile')));
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setStoreName(data.storeName);
      setDescription(data.description ?? '');
      setSupportEmail(data.supportEmail ?? '');
    }
  }, [data]);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorAlert error={error} />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaveError(null);
    try {
      await unwrap(api.PATCH('/seller/profile', { body: { storeName, description: description || null, supportEmail: supportEmail || null } }));
      await reloadUser();
      notify('Store profile saved');
    } catch (err) {
      setSaveError(errorMessage(err));
    }
  }

  return (
    <>
      <h1 className="h3 mb-3">Store profile</h1>
      <p className="small">
        Your public storefront: <Link to={`/s/${data.slug}`}>/s/{data.slug}</Link>
      </p>
      {saveError && <Alert variant="danger">{saveError}</Alert>}
      <Form onSubmit={onSubmit} style={{ maxWidth: 640 }}>
        <Form.Group className="mb-3" controlId="profile-store-name">
          <Form.Label>Store name</Form.Label>
          <Form.Control value={storeName} onChange={(e) => setStoreName(e.target.value)} required minLength={2} />
        </Form.Group>
        <Form.Group className="mb-3" controlId="profile-description">
          <Form.Label>Description</Form.Label>
          <Form.Control as="textarea" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Form.Group>
        <Form.Group className="mb-3" controlId="profile-support-email">
          <Form.Label>Support email</Form.Label>
          <Form.Control type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
        </Form.Group>
        <Button type="submit">Save</Button>
      </Form>
    </>
  );
}
