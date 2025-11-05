import { expect, test } from '@playwright/test';
import { addToCartViaApi, fx, newBuyer, productId, applySession } from '../support/helpers';

async function fillAddress(page: import('@playwright/test').Page) {
  await page.getByLabel('Address', { exact: true }).fill('42 Temple Street');
  await page.getByLabel('City').fill('Kandy');
  await page.getByLabel('Postal code').fill('20000');
  await page.getByRole('button', { name: 'Continue to payment' }).click();
}

test.describe('cart and checkout', () => {
  test('anonymous add to cart asks the shopper to log in', async ({ page }) => {
    await page.goto('/search?q=' + encodeURIComponent(fx.products.spoons.name));
    await page.locator('[data-product-card]').first().getByRole('button', { name: 'Add to cart' }).click();
    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test('add to cart, change quantities and buy', async ({ page, request }) => {
    const { session } = await newBuyer(request, 'Chamari Fernando');
    await applySession(page, session);

    await page.goto('/search?q=' + encodeURIComponent(fx.products.spoons.name));
    await page.locator('[data-product-card]').filter({ hasText: fx.products.spoons.name }).getByRole('button', { name: 'Add to cart' }).click();
    await expect(page.getByTestId('cart-count')).toHaveText('1');
    await expect(page.getByTestId('shipping-banner')).toContainText('away from free shipping');

    await page.goto('/search?q=' + encodeURIComponent(fx.products.throw.name));
    await page.locator('[data-product-card]').filter({ hasText: fx.products.throw.name }).getByRole('button', { name: 'Add to cart' }).click();
    await expect(page.getByTestId('cart-count')).toHaveText('2');

    await page.getByTestId('cart-link').click();
    await expect(page.getByTestId('cart-line')).toHaveCount(2);
    await expect(page.getByTestId('cart-subtotal')).toHaveText('$54.00');
    await expect(page.getByTestId('shipping-banner')).toHaveCount(0);

    const spoons = page.getByTestId('cart-line').filter({ hasText: fx.products.spoons.name });
    await spoons.getByRole('button', { name: 'Increase quantity' }).click();
    await expect(spoons.getByTestId('line-total')).toHaveText('$24.00');
    await expect(page.getByTestId('cart-subtotal')).toHaveText('$66.00');

    await page.getByRole('button', { name: `Remove ${fx.products.throw.name}` }).click();
    await expect(page.getByTestId('cart-line')).toHaveCount(1);
    await expect(page.getByTestId('cart-total')).toHaveText('$29.99');

    await page.getByRole('button', { name: 'Checkout' }).click();
    await expect(page.getByLabel('Full name')).toHaveValue('Chamari Fernando');
    await fillAddress(page);
    await expect(page.getByTestId('checkout-total')).toHaveText('$29.99');
    await page.getByLabel('Card number').fill('4242 4242 4242 4242');
    await page.getByLabel('Expiry (MM/YY)').fill('12/31');
    await page.getByLabel('CVC').fill('123');
    await page.getByRole('button', { name: 'Pay $29.99' }).click();

    await expect(page.getByTestId('order-placed')).toBeVisible();
    await expect(page.getByTestId('order-total')).toHaveText('$29.99');
    await expect(page.getByTestId('cart-count')).toHaveCount(0);

    await page.goto('/orders');
    await expect(page.getByTestId('order-card')).toHaveCount(1);
    await expect(page.getByTestId('order-card')).toContainText(fx.products.spoons.name);
  });

  test('a declined card keeps the cart', async ({ page, request }) => {
    const { session } = await newBuyer(request);
    await addToCartViaApi(request, session.accessToken, await productId(request, fx.products.spoons.name), 1);
    await applySession(page, session);
    await page.goto('/checkout');
    await fillAddress(page);
    await page.getByLabel('Card number').fill('4000 0000 0000 0002');
    await page.getByLabel('Expiry (MM/YY)').fill('12/31');
    await page.getByLabel('CVC').fill('123');
    await page.getByRole('button', { name: /^Pay / }).click();
    await expect(page.getByTestId('checkout-error')).toContainText('declined');
    await page.goto('/cart');
    await expect(page.getByTestId('cart-line')).toHaveCount(1);
  });

  test('checkout refuses more than the available stock', async ({ page, request }) => {
    const { session } = await newBuyer(request);
    await addToCartViaApi(request, session.accessToken, await productId(request, fx.products.pot.name), 2);
    await applySession(page, session);
    await page.goto('/cart');
    const line = page.getByTestId('cart-line');
    await expect(line.getByRole('button', { name: 'Increase quantity' })).toBeDisabled();
  });

  test('buyer can cancel an order that has not shipped', async ({ page, request }) => {
    const { session } = await newBuyer(request);
    await addToCartViaApi(request, session.accessToken, await productId(request, fx.products.spoons.name), 1);
    await applySession(page, session);
    await page.goto('/checkout');
    await fillAddress(page);
    await page.getByLabel('Card number').fill('4242424242424242');
    await page.getByLabel('Expiry (MM/YY)').fill('01/30');
    await page.getByLabel('CVC').fill('321');
    await page.getByRole('button', { name: /^Pay / }).click();
    await expect(page.getByTestId('order-placed')).toBeVisible();

    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Cancel order' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Cancelled');
    await expect(page.getByRole('button', { name: 'Cancel order' })).toHaveCount(0);
  });
});
