import type { SortOption } from '../../api/types';

export const SORT_LABELS: Record<SortOption, string> = {
  popular: 'Most popular',
  newest: 'Newest',
  price_asc: 'Price: low to high',
  price_desc: 'Price: high to low',
  rating: 'Top rated',
};
