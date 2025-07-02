import { expect, test } from '@playwright/test';
import { apiLogin, fx, applySession } from '../support/helpers';

test.describe('accounts', () => {
  test('sign up, log out and log back in', async ({ page }) => {
    const email = `new-${Date.now()}@bazario.example`;
    await page.goto('/');
    await page.getByRole('link', { name: 'Sign up' }).click();
    await page.getByLabel('Name').fill('Nimal Perera');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('short');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();

    await page.getByLabel('Password').fill(fx.password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByRole('button', { name: 'Nimal' })).toBeVisible();

    await page.getByRole('button', { name: 'Nimal' }).click();
    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();

    await page.getByRole('link', { name: 'Log in' }).click();
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(fx.password);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByRole('button', { name: 'Nimal' })).toBeVisible();
  });

  test('duplicate email and wrong password show errors', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Name').fill('Ben Again');
    await page.getByLabel('Email').fill(fx.buyer.email);
    await page.getByLabel('Password').fill(fx.password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByRole('alert')).toBeVisible();

    await page.goto('/login');
    await page.getByLabel('Email').fill(fx.buyer.email);
    await page.getByLabel('Password').fill('not-the-password');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
  });

  test('protected pages redirect to login and come back', async ({ page }) => {
    await page.goto('/orders');
    await expect(page).toHaveURL(/\/login\?next=%2Forders/);
    await page.getByLabel('Email').fill(fx.buyer.email);
    await page.getByLabel('Password').fill(fx.password);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByRole('heading', { name: 'Your orders' })).toBeVisible();
  });

  test('an expired access token is refreshed silently', async ({ page, request }) => {
    const session = await apiLogin(request, fx.buyer.email);
    await applySession(page, { accessToken: 'expired.or.invalid', refreshToken: session.refreshToken });
    await page.goto('/orders');
    await expect(page.getByRole('heading', { name: 'Your orders' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ben' })).toBeVisible();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('bz.auth') ?? '{}'));
    expect(stored.refreshToken).not.toBe(session.refreshToken);
  });
});
