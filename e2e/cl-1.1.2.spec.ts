import { test, expect } from '@playwright/test';

/**
 * E2E for CL-1.1.2 — Duplicate Email Detection.
 * One test per acceptance criterion, plus a positive control.
 * Selector policy: accessible (getByRole/getByLabel) first; no data-testid needed here.
 */

const API = 'http://localhost:5050';
// A seeded patient — guaranteed to exist on a freshly started backend.
const SEEDED_EMAIL = 'sophie.bernard@example.com';
const DUPLICATE_MESSAGE = 'A patient with this email already exists';

async function fillRequired(
  page: import('@playwright/test').Page,
  email: string,
): Promise<void> {
  await page.getByLabel('First name').fill('Dup');
  await page.getByLabel('Last name').fill('Licate');
  await page.getByLabel('Email').fill(email);
}

test.describe('CL-1.1.2 — Duplicate Email Detection', () => {
  // AC: API returns HTTP 409 when a registration request contains an already-registered email.
  test('CL-1.1.2: API returns 409 for an already-registered email', async ({ request }) => {
    const res = await request.post(`${API}/api/patients`, {
      data: { firstName: 'Dup', lastName: 'Licate', email: SEEDED_EMAIL },
    });
    expect(res.status()).toBe(409);
  });

  // AC: Frontend displays the inline message beneath the email field.
  test('CL-1.1.2: shows the inline duplicate message after submit', async ({ page }) => {
    await page.goto('/patients');
    await fillRequired(page, SEEDED_EMAIL);
    await page.getByRole('button', { name: 'Register patient' }).click();

    const error = page.getByText(DUPLICATE_MESSAGE);
    await expect(error).toBeVisible();
    await expect(error).toHaveAttribute('role', 'alert');
  });

  // AC: Error appears without a page reload.
  test('CL-1.1.2: error appears without a page reload', async ({ page }) => {
    await page.goto('/patients');
    await page.evaluate(() => ((window as unknown as { __noReload?: boolean }).__noReload = true));

    await fillRequired(page, SEEDED_EMAIL);
    await page.getByRole('button', { name: 'Register patient' }).click();
    await expect(page.getByText(DUPLICATE_MESSAGE)).toBeVisible();

    const survived = await page.evaluate(
      () => (window as unknown as { __noReload?: boolean }).__noReload === true,
    );
    expect(survived).toBe(true);
  });

  // AC: Error message is inline — not a toast or modal.
  test('CL-1.1.2: error is inline, not a toast or modal', async ({ page }) => {
    await page.goto('/patients');
    await fillRequired(page, SEEDED_EMAIL);
    await page.getByRole('button', { name: 'Register patient' }).click();

    await expect(page.getByText(DUPLICATE_MESSAGE)).toBeVisible();
    await expect(page.locator('mat-dialog-container')).toHaveCount(0);
    await expect(page.locator('mat-snack-bar-container')).toHaveCount(0);
  });

  // Supporting behaviour: editing the email clears the duplicate error (no stale error).
  test('CL-1.1.2: editing the email clears the duplicate error', async ({ page }) => {
    await page.goto('/patients');
    await fillRequired(page, SEEDED_EMAIL);
    await page.getByRole('button', { name: 'Register patient' }).click();
    await expect(page.getByText(DUPLICATE_MESSAGE)).toBeVisible();

    await page.getByLabel('Email').fill('changed.address@example.com');
    await expect(page.getByText(DUPLICATE_MESSAGE)).toBeHidden();
  });

  // Positive control: a unique email is accepted (proves the 409 is duplicate-specific).
  test('CL-1.1.2: a unique email is accepted', async ({ page }) => {
    await page.goto('/patients');
    const unique = `e2e.${Date.now()}@example.com`;
    await page.getByLabel('First name').fill('Fresh');
    await page.getByLabel('Last name').fill('Patient');
    await page.getByLabel('Email').fill(unique);
    await page.getByRole('button', { name: 'Register patient' }).click();

    await expect(page.getByText('Patient registered successfully.')).toBeVisible();
    await expect(page.getByText(DUPLICATE_MESSAGE)).toHaveCount(0);
  });
});
