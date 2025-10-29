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
});
