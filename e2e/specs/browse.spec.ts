import { expect, test } from '@playwright/test';
import { fx } from '../support/helpers';

test.describe('browsing', () => {
  test('home page shows categories and product sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Find something made with care' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Home & Living' }).first()).toBeVisible();
    await expect(page.getByRole('region', { name: 'New arrivals' })).toBeVisible();
    await expect(page.getByRole('region', { name: "Today's deals" }).getByRole('link', { name: fx.products.throw.name }).first()).toBeVisible();
  });

  test('category page paginates and sorts', async ({ page }) => {
    await page.goto(`/c/${fx.categories.textiles}`);
    await expect(page.getByRole('heading', { name: 'Textiles', level: 1 })).toBeVisible();
    await expect(page.getByText(`${fx.loomsProductCount} products`)).toBeVisible();
    await expect(page.locator('[data-product-card]')).toHaveCount(24);

    await page.getByRole('navigation', { name: 'Pages' }).getByText('2', { exact: true }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.locator('[data-product-card]')).toHaveCount(fx.loomsProductCount - 24);

    await page.getByLabel('Sort by').selectOption('price_desc');
    await expect(page).toHaveURL(/sort=price_desc/);
    const prices = await page.locator('[data-product-card] .price .fw-bold').allTextContents();
    const cents = prices.map((p) => Math.round(Number(p.replace(/[^0-9.]/g, '')) * 100));
    expect(cents).toEqual([...cents].sort((a, b) => b - a));
  });

  test('empty category shows an empty state', async ({ page }) => {
    await page.goto(`/c/${fx.categories.toys}`);
    await expect(page.getByText('No products in this category yet')).toBeVisible();
  });

  test('product page shows details, gallery, ratings and reviews', async ({ page }) => {
    await page.goto('/search?q=' + encodeURIComponent(fx.products.throw.name));
    await page.locator('[data-product-card]').filter({ hasText: fx.products.throw.name }).getByRole('heading').getByRole('link').click();
    await expect(page.getByRole('heading', { name: fx.products.throw.name, level: 1 })).toBeVisible();
    await expect(page.getByTestId('product-price')).toContainText('$42.00');
    await expect(page.getByTestId('product-price')).toContainText('$52.00');
    await expect(page.getByRole('button', { name: /Show image/ })).toHaveCount(3);
    await page.getByRole('button', { name: 'Show image 2' }).click();
    await expect(page.getByTestId('gallery-main')).toHaveAttribute('alt', 'Photo 2');
    await expect(page.getByTestId('rating-histogram')).toBeVisible();
    await expect(page.getByTestId('review')).toHaveCount(3);
    await page.getByLabel('Sort reviews').selectOption('lowest');
    await expect(page.getByTestId('review').first()).toContainText('Good quality');
    await expect(page.getByRole('cell', { name: '130 x 170 cm' })).toBeVisible();
  });

  test('unknown pages show a not found message', async ({ page }) => {
    await page.goto('/no-such-page');
    await expect(page.getByText("We couldn't find that page")).toBeVisible();
  });
});
