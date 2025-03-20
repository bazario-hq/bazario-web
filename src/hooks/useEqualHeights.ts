import { useLayoutEffect, type RefObject } from 'react';

/**
 * Makes every element matching `selector` inside the container as tall as the tallest one,
 * so card rows line up even when titles wrap differently (BZR-188).
 */
export function useEqualHeights(container: RefObject<HTMLElement>, selector: string) {
  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>(selector));
    let tallest = 0;
    for (const item of items) {
      item.style.height = 'auto';
      tallest = Math.max(tallest, item.offsetHeight);
    }
    for (const item of items) {
      item.style.height = `${tallest}px`;
    }
  });
}
