import { expect, test } from '@playwright/test';
import { API_URL, fx, newBuyer, signIn } from '../support/helpers';

test.describe('admin', () => {
  test('approve a seller application end to end', async ({ page, request, browser }) => {
    // The applicant sees their pending application.
    const applicantPage = await (await browser.newContext()).newPage();
    await signIn(applicantPage, request, fx.applicant.email);
    await applicantPage.goto('/sell');
    await expect(applicantPage.locator('[data-status="pending"]')).toBeVisible();

    await signIn(page, request, fx.admin.email);
    await page.goto('/admin/sellers?status=pending');
    const row = page.getByTestId('admin-seller-row').filter({ hasText: fx.applicant.store });
    await row.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByText(`${fx.applicant.store} is now active`)).toBeVisible();

    // A fresh login picks up the new seller role.
    await signIn(applicantPage, request, fx.applicant.email);
    await applicantPage.goto('/seller');
    await expect(applicantPage.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(applicantPage.getByText(fx.applicant.store).first()).toBeVisible();
  });

  test('moderate a held review', async ({ page, request }) => {
    await signIn(page, request, fx.admin.email);
    await page.goto('/admin/reviews');
    const review = page.getByTestId('moderation-review').filter({ hasText: 'Smaller than expected' });
    await review.getByLabel('Moderation note').fill('Fair feedback');
    await review.getByRole('button', { name: 'Publish' }).click();
    await expect(page.getByText('Review published')).toBeVisible();
    await expect(page.getByTestId('moderation-review').filter({ hasText: 'Smaller than expected' })).toHaveCount(0);

    await page.getByLabel('Status').selectOption('published');
    await expect(page.getByTestId('moderation-review').filter({ hasText: 'Smaller than expected' })).toBeVisible();
  });

  test('suspend a user who then cannot log in', async ({ page, request }) => {
    const { email } = await newBuyer(request, 'Spammy Sam');
    await signIn(page, request, fx.admin.email);
    await page.goto('/admin/users');
    await page.getByLabel('Search users').fill(email);
    await page.getByRole('main').getByRole('button', { name: 'Search' }).click();
    const row = page.getByTestId('admin-user-row');
    await expect(row).toHaveCount(1);
    await row.getByRole('button', { name: 'Suspend' }).click();
    await expect(row.locator('[data-status="suspended"]')).toBeVisible();

    const res = await request.post(`${API_URL}/api/auth/login`, { data: { email, password: fx.password } });
    expect(res.ok()).toBeFalsy();

    await page.goto('/admin/audit-log');
    await expect(page.getByTestId('audit-row').first()).toBeVisible();
  });

  test('platform overview shows totals', async ({ page, request }) => {
    await signIn(page, request, fx.admin.email);
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Platform overview' })).toBeVisible();
    await expect(page.getByTestId('total-gmv')).toContainText('$');
    await expect(page.getByTestId('total-sellers')).not.toHaveText('0');
  });

  test('non-admins cannot open the admin area', async ({ page, request }) => {
    await signIn(page, request, fx.buyer.email);
    await page.goto('/admin');
    await expect(page.getByText("You don't have access to this page.")).toBeVisible();
  });
});
