import { describe, expect, it } from 'vitest';
import { categoryPath, flattenCategories } from '../../src/lib/categories';

const tree = [
  {
    id: 1,
    name: 'Home',
    slug: 'home',
    children: [{ id: 2, name: 'Textiles', slug: 'textiles', children: [{ id: 3, name: 'Cushions', slug: 'cushions', children: [] }] }],
  },
  { id: 4, name: 'Kitchen', slug: 'kitchen', children: [] },
];

describe('categories', () => {
  it('finds the path to a nested category', () => {
    expect(categoryPath(tree, 3).map((c) => c.slug)).toEqual(['home', 'textiles', 'cushions']);
    expect(categoryPath(tree, 4).map((c) => c.slug)).toEqual(['kitchen']);
    expect(categoryPath(tree, 99)).toEqual([]);
  });

  it('flattens depth first with labels', () => {
    expect(flattenCategories(tree).map((c) => [c.label, c.depth])).toEqual([
      ['Home', 0],
      ['Home › Textiles', 1],
      ['Home › Textiles › Cushions', 2],
      ['Kitchen', 0],
    ]);
  });
});
