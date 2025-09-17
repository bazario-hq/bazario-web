import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { ProductCard as ProductCardData } from '../../src/api/types';
import { Pager } from '../../src/components/Pager';
import { Price } from '../../src/components/Price';
import { ProductCard } from '../../src/components/ProductCard';
import { Rating, Stars } from '../../src/components/Rating';
import { ShippingBanner } from '../../src/components/ShippingBanner';
import { StatusBadge } from '../../src/components/StatusBadge';
import { fakeApp, renderWithApp } from './render';

const product: ProductCardData = {
  id: 7,
  name: 'Indigo Batik Throw',
  slug: 'indigo-batik-throw',
  description: 'Hand dyed.',
  priceCents: 4200,
  compareAtCents: 5200,
  currency: 'USD',
  ratingAvg: 4.5,
  ratingCount: 12,
  stock: 3,
  specs: {},
  image: null,
  seller: { id: 1, storeName: 'Lanka Looms', slug: 'lanka-looms' },
  categoryId: 3,
  publishedAt: null,
};

describe('Price', () => {
  it('shows a sale price with the original struck through', () => {
    render(<Price cents={4200} compareAt={5200} />);
    expect(screen.getByText('$42.00')).toHaveClass('text-danger');
    expect(screen.getByText('$52.00').tagName).toBe('S');
  });

  it('ignores a compare-at price that is not higher', () => {
    render(<Price cents={4200} compareAt={4200} />);
    expect(screen.queryByText('$42.00', { selector: 's' })).toBeNull();
  });
});

describe('Rating', () => {
  it('labels the star value', () => {
    render(<Stars value={3.5} />);
    expect(screen.getByLabelText('3.5 out of 5 stars')).toBeInTheDocument();
  });

  it('says when there are no reviews', () => {
    render(<Rating avg={0} count={0} />);
    expect(screen.getByText('No reviews yet')).toBeInTheDocument();
  });
});

describe('StatusBadge', () => {
  it('title-cases the status', () => {
    render(<StatusBadge status="partially_shipped" />);
    expect(screen.getByText('Partially Shipped')).toHaveAttribute('data-status', 'partially_shipped');
  });
});

describe('ProductCard', () => {
  const categories = [{ id: 1, name: 'Home', slug: 'home', children: [{ id: 3, name: 'Textiles', slug: 'textiles', children: [] }] }];

  it('shows the product, its category and links to the product page', () => {
    renderWithApp(<ProductCard product={product} />, { app: fakeApp({ categories }) });
    for (const link of screen.getAllByRole('link', { name: 'Indigo Batik Throw' })) expect(link).toHaveAttribute('href', '/p/7/indigo-batik-throw');
    expect(screen.getByText('Textiles')).toBeInTheDocument();
    expect(screen.getByText('Lanka Looms')).toBeInTheDocument();
  });

  it('sends anonymous shoppers to log in', async () => {
    renderWithApp(<ProductCard product={product} />);
    fireEvent.click(screen.getByRole('button', { name: /Add to cart/ }));
    expect(await screen.findByText('login page')).toBeInTheDocument();
  });

  it('adds to cart for signed-in shoppers', async () => {
    const app = fakeApp({ user: { id: 1, email: 'a@b.c', name: 'A', role: 'buyer', createdAt: '', seller: null } });
    renderWithApp(<ProductCard product={product} />, { app });
    fireEvent.click(screen.getByRole('button', { name: /Add to cart/ }));
    await waitFor(() => expect(app.addToCart).toHaveBeenCalledWith(7, 1));
    expect(app.notify).toHaveBeenCalledWith('Added to cart');
  });

  it('shows a disabled button when out of stock', () => {
    renderWithApp(<ProductCard product={{ ...product, stock: 0 }} />);
    expect(screen.getByRole('button', { name: 'Out of stock' })).toBeDisabled();
  });
});

describe('ShippingBanner', () => {
  const cart = (subtotalCents: number, itemCount = 1) => ({ items: [], subtotalCents, shippingCents: 599, totalCents: subtotalCents + 599, currency: 'USD', itemCount });

  it('shows how much is missing for free shipping', () => {
    renderWithApp(<ShippingBanner />, { app: fakeApp({ cart: cart(3000) }) });
    expect(screen.getByTestId('shipping-banner')).toHaveTextContent("You're $20.00 away from free shipping.");
  });
});

describe('MemoryRouter sanity', () => {
  it('renders', () => {
    render(<MemoryRouter><span>ok</span></MemoryRouter>);
    expect(screen.getByText('ok')).toBeInTheDocument();
  });
});
