import { test, expect } from '@playwright/test';

/**
 * E2E for CL-1.1.3 — Registration Success State.
 * One test per acceptance criterion. Accessible selectors first.
 */

function uniqueEmail(): string {
  return `e2e.cl113.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function register(
  page: import('@playwright/test').Page,
  first: string,
  last: string,
  email: string,
): Promise<void> {
  await page.getByLabel('First name').fill(first);
  await page.getByLabel('Last name').fill(last);
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Register patient' }).click();
}

test.describe('CL-1.1.3 — Registration Success State', () => {
  // AC: A brief success indicator is shown after submission.
  test('CL-1.1.3: shows a success indicator after registration', async ({ page }) => {
    await page.goto('/patients');
    await register(page, 'Fresh', 'Patient', uniqueEmail());

    await expect(page.getByText('Patient registered successfully.')).toBeVisible();
  });

  // AC: After successful save, the registration form clears all fields.
  test('CL-1.1.3: clears the form after a successful registration', async ({ page }) => {
    await page.goto('/patients');
    await register(page, 'Fresh', 'Patient', uniqueEmail());
    await expect(page.getByText('Patient registered successfully.')).toBeVisible();

    await expect(page.getByLabel('First name')).toHaveValue('');
    await expect(page.getByLabel('Last name')).toHaveValue('');
    await expect(page.getByLabel('Email')).toHaveValue('');
  });

  // AC: The newly registered patient appears at the top of the patient list immediately.
  test('CL-1.1.3: new patient appears at the top of the recently registered list', async ({
    page,
  }) => {
    await page.goto('/patients');
    const lastName = `Top${Date.now()}`;
    await register(page, 'Fresh', lastName, uniqueEmail());

    await expect(page.locator('mat-list-item').first()).toContainText(`Fresh ${lastName}`);
  });

  // AC: No full page reload — list updates via Angular signal.
  test('CL-1.1.3: list updates without a page reload', async ({ page }) => {
    await page.goto('/patients');
    await page.evaluate(() => ((window as unknown as { __noReload?: boolean }).__noReload = true));

    await register(page, 'Fresh', 'Patient', uniqueEmail());
    await expect(page.getByText('Patient registered successfully.')).toBeVisible();

    const survived = await page.evaluate(
      () => (window as unknown as { __noReload?: boolean }).__noReload === true,
    );
    expect(survived).toBe(true);
  });
});
