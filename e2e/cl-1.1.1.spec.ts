import { test, expect } from '@playwright/test';

/**
 * E2E for CL-1.1.1 — Registration Form.
 * One test per acceptance criterion. Accessible selectors (getByRole/getByLabel) first.
 */

function uniqueEmail(): string {
  return `e2e.cl111.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
}

test.describe('CL-1.1.1 — Registration Form', () => {
  // AC: Form cannot be submitted with empty required fields; errors are inline (not a toast).
  test('CL-1.1.1: blocks submit and shows inline errors when required fields are empty', async ({
    page,
  }) => {
    await page.goto('/patients');
    await page.getByRole('button', { name: 'Register patient' }).click();

    await expect(page.getByText('First name is required')).toBeVisible();
    await expect(page.getByText('Last name is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();

    // No registration happened, and errors are inline — not a toast or modal.
    await expect(page.getByText('Patient registered successfully.')).toHaveCount(0);
    await expect(page.locator('mat-snack-bar-container')).toHaveCount(0);
    await expect(page.locator('mat-dialog-container')).toHaveCount(0);
  });

  // AC: Email field validates correct format (rejects "user@").
  test('CL-1.1.1: rejects an invalid email format', async ({ page }) => {
    await page.goto('/patients');
    await page.getByLabel('First name').fill('Marie');
    await page.getByLabel('Last name').fill('Dubois');
    await page.getByLabel('Email').fill('user@');
    await page.getByRole('button', { name: 'Register patient' }).click();

    await expect(page.getByText('Enter a valid email address')).toBeVisible();
    await expect(page.getByText('Patient registered successfully.')).toHaveCount(0);
  });

  // AC: Phone field validates format when provided.
  test('CL-1.1.1: rejects a malformed phone number', async ({ page }) => {
    await page.goto('/patients');
    await page.getByLabel('First name').fill('Marie');
    await page.getByLabel('Last name').fill('Dubois');
    await page.getByLabel('Email').fill(uniqueEmail());
    await page.getByLabel('Phone', { exact: true }).fill('12');
    await page.getByRole('button', { name: 'Register patient' }).click();

    await expect(page.getByText('Enter a valid phone number')).toBeVisible();
    await expect(page.getByText('Patient registered successfully.')).toHaveCount(0);
  });

  // AC: Emergency contact fields are optional and do not block submission.
  test('CL-1.1.1: registers successfully without an emergency contact', async ({ page }) => {
    await page.goto('/patients');
    await page.getByLabel('First name').fill('Marie');
    await page.getByLabel('Last name').fill('Dubois');
    await page.getByLabel('Email').fill(uniqueEmail());
    await page.getByRole('button', { name: 'Register patient' }).click();

    await expect(page.getByText('Patient registered successfully.')).toBeVisible();
  });
});
