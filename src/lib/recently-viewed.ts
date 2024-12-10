const KEY = 'bz.recent';
const MAX = 12;

export interface RecentProduct {
  id: number;
  slug: string;
  name: string;
}

export function recentlyViewed(): RecentProduct[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as RecentProduct[];
  } catch {
    return [];
  }
}

export function rememberViewed(product: RecentProduct) {
  const list = recentlyViewed().filter((p) => p.id !== product.id);
  list.unshift({ id: product.id, slug: product.slug, name: product.name });
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}
