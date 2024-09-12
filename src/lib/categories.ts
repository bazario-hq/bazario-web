import type { CategoryNode, CategoryRef } from '../api/types';

/** Path from the root to the category with the given id, or [] when unknown. */
export function categoryPath(tree: CategoryNode[], id: number): CategoryRef[] {
  for (const node of tree) {
    if (node.id === id) return [{ id: node.id, name: node.name, slug: node.slug }];
    const below = categoryPath(node.children, id);
    if (below.length) return [{ id: node.id, name: node.name, slug: node.slug }, ...below];
  }
  return [];
}

export interface FlatCategory extends CategoryRef {
  depth: number;
  label: string;
}

/** Flattens the tree for selects and menus, depth first. */
export function flattenCategories(tree: CategoryNode[], depth = 0, prefix = ''): FlatCategory[] {
  const out: FlatCategory[] = [];
  for (const node of tree) {
    const label = prefix ? `${prefix} › ${node.name}` : node.name;
    out.push({ id: node.id, name: node.name, slug: node.slug, depth, label });
    out.push(...flattenCategories(node.children, depth + 1, label));
  }
  return out;
}
