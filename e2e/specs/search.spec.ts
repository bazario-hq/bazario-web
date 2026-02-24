import { expect, test } from '@playwright/test';
import { fx } from '../support/helpers';

test.describe('search', () => {
  test('header search shows matching products', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('searchbox', { name: 'Search products' }).fill('cushion');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page).toHaveURL(/\/search\?q=cushion/);
    await expect(page.getByRole('heading', { name: 'Results for “cushion”' })).toBeVisible();
    await expect(page.getByTestId('result-count')).toHaveText('20 results');
    await expect(page.locator('[data-product-card]')).toHaveCount(20);
  });

  test('filters narrow the results', async ({ page }) => {
    await page.goto('/search?category=' + fx.categories.cookware);
    await expect(page.locator('[data-product-card]').filter({ hasText: fx.products.kettle.name })).toHaveCount(1);
    const before = Number((await page.getByTestId('result-count').textContent())!.split(' ')[0]);

    await page.getByLabel('In stock only').check();
    await expect(page).toHaveURL(/inStock=true/);
    await expect(page.getByTestId('result-count')).toHaveText(`${before - 1} results`);
    await expect(page.locator('[data-product-card]').filter({ hasText: fx.products.kettle.name })).toHaveCount(0);

    await page.getByLabel('4★ & up').check();
    await expect(page.getByText('No products match your search')).toBeVisible();
    await page.getByRole('radio', { name: 'Any' }).check();
    await expect(page.getByTestId('result-count')).toHaveText(`${before - 1} results`);
  });

  test('category facets and the refine box update the results', async ({ page }) => {
    await page.goto('/search?q=no.');
    await page.locator('.facet-list').getByRole('button', { name: 'Cushions' }).click();
    await expect(page).toHaveURL(/category=cushions/);
    await expect(page.getByTestId('result-count')).toHaveText('20 results');

    await page.getByLabel('Search within results').fill('Cushion Cover No. 07');
    await expect(page.getByTestId('result-count')).toHaveText('1 result');
    await expect(page.locator('[data-product-card]')).toHaveCount(1);
  });

  test('all products loads more results on scroll', async ({ page }) => {
    await page.goto('/search');
    const total = Number((await page.getByTestId('result-count').textContent())!.replace(/\D/g, ''));
    expect(total).toBeGreaterThan(48);
    await expect(page.locator('[data-product-card]')).toHaveCount(24);
    await page.mouse.wheel(0, 20000);
    await expect.poll(() => page.locator('[data-product-card]').count()).toBeGreaterThanOrEqual(48);
    const loadMore = page.getByRole('button', { name: 'Load more' });
    if (await loadMore.isVisible()) await loadMore.click();
    await expect(page.locator('[data-product-card]')).toHaveCount(total);
    await expect(page.getByRole('button', { name: 'Load more' })).toHaveCount(0);
  });

  test('sorting by price', async ({ page }) => {
    await page.goto('/search?category=' + fx.categories.kitchen);
    await page.getByLabel('Sort by').selectOption('price_asc');
    await expect(page.locator('[data-product-card]').first()).toContainText('Coconut Shell Bowl No. 1');
  });
});
