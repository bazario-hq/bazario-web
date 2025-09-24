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

  test('platform overview shows totals', async ({ page, request }) => {
    await signIn(page, request, fx.admin.email);
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Platform overview' })).toBeVisible();
    await expect(page.getByTestId('total-gmv')).toContainText('$');
    await expect(page.getByTestId('total-sellers')).not.toHaveText('0');
  });
});
