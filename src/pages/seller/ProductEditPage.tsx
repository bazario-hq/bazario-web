import { useEffect, useState, type FormEvent } from 'react';
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { api, authFetch, API_BASE, ApiError, errorMessage, unwrap } from '../../api/client';
import type { SellerProduct } from '../../api/types';
import { ErrorAlert, Loading } from '../../components/Feedback';
import { Icon } from '../../components/Icon';
import { StatusBadge } from '../../components/StatusBadge';
import { useApp } from '../../context/AppContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { flattenCategories } from '../../lib/categories';
import { centsToDollars, dollarsToCents } from '../../lib/format';

interface FormState {
  name: string;
  description: string;
  price: string;
  compareAt: string;
  categoryId: string;
  stock: string;
  lowStockThreshold: string;
  status: 'draft' | 'active' | 'archived';
  specs: { key: string; value: string }[];
}

function toForm(p?: SellerProduct): FormState {
  return {
    name: p?.name ?? '',
    description: p?.description ?? '',
    price: centsToDollars(p?.priceCents),
    compareAt: centsToDollars(p?.compareAtCents),
    categoryId: p ? String(p.categoryId) : '',
    stock: p ? String(p.stock) : '0',
    lowStockThreshold: p ? String(p.lowStockThreshold) : '5',
    status: p?.status ?? 'draft',
    specs: p ? Object.entries(p.specs).map(([key, value]) => ({ key, value })) : [],
  };
}

export function ProductEditPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const productId = isNew ? null : Number(id);
  const { categories, notify } = useApp();
  const navigate = useNavigate();
  const [product, setProduct] = useState<SellerProduct | undefined>();
  const [form, setForm] = useState<FormState>(toForm());
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useDocumentTitle(isNew ? 'New product' : product?.name);

  useEffect(() => {
    if (!productId) return;
    unwrap(api.GET('/seller/products/{id}', { params: { path: { id: productId } } }))
      .then((p) => {
        setProduct(p);
        setForm(toForm(p));
      })
      .catch(setLoadError)
      .finally(() => setLoading(false));
  }, [productId]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const priceCents = dollarsToCents(form.price);
    const compareAtCents = form.compareAt ? dollarsToCents(form.compareAt) : null;
    if (!Number.isFinite(priceCents) || priceCents < 0) return setError('Enter a valid price');
    if (!form.categoryId) return setError('Choose a category');
    const specs = Object.fromEntries(form.specs.filter((s) => s.key.trim()).map((s) => [s.key.trim(), s.value]));
    const common = {
      name: form.name,
      description: form.description,
      priceCents,
      compareAtCents,
      categoryId: Number(form.categoryId),
      lowStockThreshold: Number(form.lowStockThreshold) || 0,
      specs,
    };
    setSaving(true);
    try {
      if (isNew) {
        const created = await unwrap(
          api.POST('/seller/products', { body: { ...common, stock: Number(form.stock) || 0, status: form.status === 'archived' ? 'draft' : form.status } }),
        );
        notify('Product created');
        navigate(`/seller/products/${created.id}`, { replace: true });
      } else {
        const updated = await unwrap(api.PATCH('/seller/products/{id}', { params: { path: { id: productId! } }, body: { ...common, status: form.status } }));
        setProduct(updated);
        setForm(toForm(updated));
        notify('Product saved');
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!productId || !window.confirm('Delete this product? It will be removed from your store.')) return;
    try {
      await unwrap(api.DELETE('/seller/products/{id}', { params: { path: { id: productId } } }));
      notify('Product deleted');
      navigate('/seller/products');
    } catch (err) {
      notify(errorMessage(err), 'danger');
    }
  }

  if (loading) return <Loading />;
  if (loadError) return <ErrorAlert error={loadError} />;

  const options = flattenCategories(categories);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">
          {isNew ? 'New product' : product?.name} {product && <StatusBadge status={product.status} />}
        </h1>
        {!isNew && (
          <Button variant="outline-danger" size="sm" onClick={onDelete}>
            <Icon name="trash" className="me-1" /> Delete
          </Button>
        )}
      </div>
      <Row className="g-4">
        <Col lg={8}>
          <Form onSubmit={onSubmit} aria-label="Product details">
            {error && <Alert variant="danger">{error}</Alert>}
            <Form.Group className="mb-3" controlId="product-name">
              <Form.Label>Name</Form.Label>
              <Form.Control value={form.name} onChange={(e) => set('name', e.target.value)} required minLength={2} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="product-description">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={6} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </Form.Group>
            <Row className="g-3 mb-3">
              <Col md={4}>
                <Form.Group controlId="product-price">
                  <Form.Label>Price (USD)</Form.Label>
                  <Form.Control inputMode="decimal" value={form.price} onChange={(e) => set('price', e.target.value)} required />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="product-compare">
                  <Form.Label>Compare-at price</Form.Label>
                  <Form.Control inputMode="decimal" value={form.compareAt} onChange={(e) => set('compareAt', e.target.value)} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="product-status">
                  <Form.Label>Status</Form.Label>
                  <Form.Select value={form.status} onChange={(e) => set('status', e.target.value as FormState['status'])}>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    {!isNew && <option value="archived">Archived</option>}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group controlId="product-category">
                  <Form.Label>Category</Form.Label>
                  <Form.Select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} required>
                    <option value="">Choose…</option>
                    {options.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              {isNew && (
                <Col md={3}>
                  <Form.Group controlId="product-stock">
                    <Form.Label>Initial stock</Form.Label>
                    <Form.Control type="number" min={0} value={form.stock} onChange={(e) => set('stock', e.target.value)} />
                  </Form.Group>
                </Col>
              )}
              <Col md={3}>
                <Form.Group controlId="product-low-stock">
                  <Form.Label>Low stock alert</Form.Label>
                  <Form.Control type="number" min={0} value={form.lowStockThreshold} onChange={(e) => set('lowStockThreshold', e.target.value)} />
                </Form.Group>
              </Col>
            </Row>
            <fieldset className="mb-3">
              <legend className="h6">Specifications</legend>
              {form.specs.map((s, i) => (
                <Row key={i} className="g-2 mb-2">
                  <Col>
                    <Form.Control aria-label="Spec name" placeholder="e.g. material" value={s.key} onChange={(e) => set('specs', form.specs.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))} />
                  </Col>
                  <Col>
                    <Form.Control aria-label="Spec value" placeholder="e.g. cotton" value={s.value} onChange={(e) => set('specs', form.specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                  </Col>
                  <Col xs="auto">
                    <Button variant="outline-secondary" aria-label="Remove spec" onClick={() => set('specs', form.specs.filter((_, j) => j !== i))}>
                      <Icon name="times" />
                    </Button>
                  </Col>
                </Row>
              ))}
              <Button variant="link" size="sm" className="p-0" onClick={() => set('specs', [...form.specs, { key: '', value: '' }])}>
                + Add specification
              </Button>
            </fieldset>
            <Button type="submit" disabled={saving}>
              {isNew ? 'Create product' : 'Save changes'}
            </Button>
          </Form>
        </Col>
        <Col lg={4}>
          <Card>
            <Card.Body>
              <h2 className="h6">Images</h2>
              {isNew ? (
                <p className="small text-muted mb-0">Save the product first, then add images.</p>
              ) : (
                <>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {product?.images.map((img) => (
                      <div key={img.id} className="position-relative seller-image" data-testid="product-image">
                        <img src={img.thumbUrl} alt={img.altText ?? ''} width={96} height={96} className="rounded object-fit-cover" />
                        <Button size="sm" variant="danger" className="position-absolute top-0 end-0 py-0 px-1" aria-label="Remove image" onClick={() => removeImage(img.id)}>
                          <Icon name="times" />
                        </Button>
                      </div>
                    ))}
                    {product?.images.length === 0 && <span className="small text-muted">No images yet.</span>}
                  </div>
                  <Form.Group controlId="image-file" className="mb-2">
                    <Form.Label className="small">Add an image (JPEG, PNG or WebP)</Form.Label>
                    <Form.Control type="file" size="sm" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile((e.target as HTMLInputElement).files?.[0] ?? null)} />
                  </Form.Group>
                  <Form.Group controlId="image-alt" className="mb-2">
                    <Form.Control size="sm" placeholder="Alt text (optional)" value={altText} onChange={(e) => setAltText(e.target.value)} />
                  </Form.Group>
                  <Button size="sm" disabled={!file || uploading} onClick={onUpload}>
                    <Icon name="upload" className="me-1" /> Upload
                  </Button>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}
