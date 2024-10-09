import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { ProductCard as ProductCardData } from '../../src/api/types';
import { Pager } from '../../src/components/Pager';
import { Price } from '../../src/components/Price';
import { ProductCard } from '../../src/components/ProductCard';
import { Rating, Stars } from '../../src/components/Rating';
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

describe('MemoryRouter sanity', () => {
  it('renders', () => {
    render(<MemoryRouter><span>ok</span></MemoryRouter>);
    expect(screen.getByText('ok')).toBeInTheDocument();
  });
});
