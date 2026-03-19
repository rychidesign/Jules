import { test, expect } from '@playwright/test';

test('login page loads correctly', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await expect(page.locator('h2')).toContainText('Sign in to AIO GEO Analyzer');
  await page.screenshot({ path: 'login_page.png' });
});

test('dashboard redirects to login if not authenticated', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await expect(page).toHaveURL(/.*\/login/);
});
