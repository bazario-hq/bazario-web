import path from 'node:path';
import { expect, test } from '@playwright/test';
import { API_URL, apiLogin, fx, newBuyer, signIn, applySession } from '../support/helpers';

test.describe('seller area', () => {
  test.beforeEach(async ({ page, request }) => {
    await signIn(page, request, fx.seller.email);
  });

  test('dashboard shows KPIs that match the sales report', async ({ page }) => {
    await page.goto('/seller');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByTestId('sales-chart')).toBeVisible();
    const revenue = await page.getByTestId('kpi-revenue').textContent();
    const orders = await page.getByTestId('kpi-orders').textContent();

    await page.getByRole('link', { name: 'Reports' }).click();
    await page.getByRole('button', { name: 'Run report' }).click();
    await expect(page.getByTestId('report-total')).toHaveText(revenue!);
    await expect(page.getByTestId('report-orders')).toHaveText(orders!);
  });

  test('create a product with an image and publish it', async ({ page }) => {
    const name = `Palmyrah Basket ${Date.now()}`;
    await page.goto('/seller/products');
    await page.getByRole('link', { name: 'New product' }).click();
    await page.getByLabel('Name').fill(name);
    await page.getByLabel('Description').fill('Woven from palmyrah leaves in Jaffna.');
    await page.getByLabel('Price (USD)').fill('24.50');
    await page.getByLabel('Category').selectOption({ label: 'Home & Living' });
    await page.getByLabel('Initial stock').fill('7');
    await page.getByRole('button', { name: '+ Add specification' }).click();
    await page.getByLabel('Spec name').fill('material');
    await page.getByLabel('Spec value').fill('palmyrah');
    await page.getByRole('button', { name: 'Create product' }).click();
    await expect(page).toHaveURL(/\/seller\/products\/\d+$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Draft');

    await page.getByLabel('Add an image (JPEG, PNG or WebP)').setInputFiles(path.join(import.meta.dirname, '../support/basket.jpg'));
    await page.getByRole('button', { name: 'Upload' }).click();
    await expect(page.getByTestId('product-image')).toHaveCount(1);

    await page.getByLabel('Status').selectOption('active');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Active');

    await page.goto('/search?q=' + encodeURIComponent(name));
    const card = page.locator('[data-product-card]').filter({ hasText: name });
    await expect(card).toHaveCount(1);
    await expect(card.locator('img')).toHaveAttribute('src', /\/images\/products\//);
    await expect(card).toContainText('$24.50');
  });

  test('edit a price and see it on the product page', async ({ page }) => {
    await page.goto('/seller/products?q=' + encodeURIComponent('Woven Table Runner No. 02'));
    await page.getByRole('link', { name: 'Woven Table Runner No. 02' }).click();
    await page.getByLabel('Price (USD)').fill('19.95');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Product saved')).toBeVisible();
    const id = page.url().split('/').pop();
    await page.goto(`/p/${id}`);
    await expect(page.getByTestId('product-price')).toHaveText('$19.95');
  });

  test('bulk update stock and see the history', async ({ page }) => {
    await page.goto('/seller/inventory');
    await page.getByLabel('Stock for Handloom Cushion Cover No. 01').fill('3');
    await page.getByLabel('Stock for Handloom Cushion Cover No. 03').fill('40');
    await expect(page.getByText('2 unsaved change(s)')).toBeVisible();
    await page.getByLabel('Reason').fill('stock take');
    await page.getByRole('button', { name: 'Save stock' }).click();
    await expect(page.getByText('Updated stock for 2 products')).toBeVisible();

    await page.getByLabel('Low stock only').check();
    await expect(page.getByTestId('inventory-row').filter({ hasText: 'Handloom Cushion Cover No. 01' })).toBeVisible();
    await page.getByRole('button', { name: 'History for Handloom Cushion Cover No. 01' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('cell', { name: 'stock take' })).toBeVisible();
    await expect(dialog.getByRole('cell', { name: '-22' })).toBeVisible();
  });

  test('payouts and store profile', async ({ page }) => {
    await page.goto('/seller/payouts');
    await expect(page.getByTestId('payout-row').first()).toBeVisible();
    await expect(page.getByTestId('payout-net-total')).toContainText('$');

    await page.goto('/seller/profile');
    await page.getByLabel('Description').fill('Handloom textiles from Kurunegala.');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Store profile saved')).toBeVisible();
    await page.goto(`/s/${fx.seller.slug}`);
    await expect(page.getByText('Handloom textiles from Kurunegala.')).toBeVisible();
  });

  test('buyers are sent to the seller application', async ({ page, request }) => {
    const { session } = await newBuyer(request);
    await applySession(page, session);
    await page.goto('/seller');
    await expect(page).toHaveURL(/\/sell$/);
    await expect(page.getByRole('heading', { name: 'Open your store' })).toBeVisible();
    expect(API_URL).toContain('localhost');
  });
});
