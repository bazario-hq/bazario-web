import { expect, test } from '@playwright/test';
import { fx, newBuyer, signIn, applySession } from '../support/helpers';

test.describe('buyer account', () => {
  test('order history shows past orders with their status', async ({ page, request }) => {
    await signIn(page, request, fx.buyer.email);
    await page.goto('/orders');
    await expect(page.getByTestId('order-card')).toHaveCount(2);
    const delivered = page.getByTestId('order-card').filter({ hasText: fx.products.throw.name });
    await expect(delivered.locator('[data-status="delivered"]').first()).toBeVisible();
    await delivered.getByRole('link', { name: /^#/ }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Delivered');
    await expect(page.getByText(/Tracking LK/).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel order' })).toHaveCount(0);
  });

  test('wishlist: save, view and remove', async ({ page, request }) => {
    const { session } = await newBuyer(request);
    await applySession(page, session);
    await page.goto('/search?q=' + encodeURIComponent(fx.products.pot.name));
    const card = page.locator('[data-product-card]').filter({ hasText: fx.products.pot.name });
    await card.getByRole('button', { name: 'Save to wishlist' }).click();
    await expect(card.getByRole('button', { name: 'Remove from wishlist' })).toBeVisible();

    await page.getByRole('link', { name: 'Wishlist' }).click();
    await expect(page.locator('[data-product-card]')).toHaveCount(1);
    await page.locator('[data-product-card]').getByRole('button', { name: 'Remove from wishlist' }).click();
    await expect(page.getByText('Your wishlist is empty')).toBeVisible();
  });

  test('notifications: unread badge and mark all as read', async ({ page, request }) => {
    await signIn(page, request, fx.buyer.email);
    await page.goto('/');
    await expect(page.getByTestId('unread-count')).toHaveText('2');
    await page.getByRole('link', { name: 'Notifications' }).click();
    await expect(page.getByTestId('notification')).toHaveCount(3);
    await page.getByLabel('Unread only').check();
    await expect(page.getByTestId('notification')).toHaveCount(2);
    await page.getByRole('button', { name: 'Mark all as read' }).click();
    await expect(page.getByTestId('unread-count')).toHaveCount(0);
    await expect(page.locator('[data-testid="notification"][data-read="false"]')).toHaveCount(0);
  });

  test('a buyer reviews a product they bought', async ({ page, request }) => {
    await signIn(page, request, fx.buyer.email);
    await page.goto('/search?q=' + encodeURIComponent(fx.products.throw.name));
    await page.locator('[data-product-card]').filter({ hasText: fx.products.throw.name }).getByRole('heading').getByRole('link').click();
    await expect(page.getByTestId('review')).toHaveCount(3);
    await page.getByRole('button', { name: 'Write a review' }).click();
    const form = page.getByRole('form', { name: 'Write a review' });
    await form.getByLabel('Rating').selectOption('4');
    await form.getByLabel('Title').fill('Warm and soft');
    await form.getByLabel('Review').fill('We use it every evening on the veranda.');
    await form.getByRole('button', { name: 'Submit review' }).click();
    await expect(page.getByText('Thanks for your review!')).toBeVisible();
    await expect(page.getByTestId('review')).toHaveCount(4);
    await expect(page.getByTestId('review').first()).toContainText('Warm and soft');

    await page.getByRole('button', { name: 'Write a review' }).click();
    await form.getByLabel('Title').fill('Again');
    await form.getByLabel('Review').fill('Second review');
    await form.getByRole('button', { name: 'Submit review' }).click();
    await expect(form.getByRole('alert')).toContainText('already reviewed');
  });

  test('buyers cannot review products they have not bought', async ({ page, request }) => {
    const { session } = await newBuyer(request);
    await applySession(page, session);
    await page.goto('/search?q=' + encodeURIComponent(fx.products.throw.name));
    await page.locator('[data-product-card]').filter({ hasText: fx.products.throw.name }).getByRole('heading').getByRole('link').click();
    await page.getByRole('button', { name: 'Write a review' }).click();
    const form = page.getByRole('form', { name: 'Write a review' });
    await form.getByLabel('Title').fill('Looks nice');
    await form.getByLabel('Review').fill('Have not bought it yet');
    await form.getByRole('button', { name: 'Submit review' }).click();
    await expect(form.getByRole('alert')).toContainText('purchased');
  });
});
