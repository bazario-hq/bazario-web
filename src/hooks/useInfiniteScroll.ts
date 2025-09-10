import { useEffect } from 'react';

/** Calls `onLoadMore` when the user scrolls near the bottom of the page. */
export function useInfiniteScroll(onLoadMore: () => void, enabled: boolean, threshold = 600) {
  useEffect(() => {
    if (!enabled) return;
    const onScroll = () => {
      const cards = document.querySelectorAll('[data-product-card]');
      const last = cards[cards.length - 1] as HTMLElement | undefined;
      const bottom = last ? last.getBoundingClientRect().bottom : document.body.offsetHeight;
      if (bottom - window.innerHeight < threshold) {
        onLoadMore();
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [onLoadMore, enabled, threshold]);
}
