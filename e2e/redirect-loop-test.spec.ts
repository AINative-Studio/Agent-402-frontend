import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:5173';
const TEST_API_KEY = 'demo_key_user1_abc123';

test.describe('Redirect Loop Verification', () => {
  test('should NOT enter infinite redirect loop when accessing root URL', async ({ page }) => {
    const navigationEvents: string[] = [];

    // Track all navigations
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        navigationEvents.push(frame.url());
      }
    });

    // Clear any existing auth
    await page.goto(`${FRONTEND_URL}/login`);
    await page.evaluate(() => localStorage.clear());

    // Navigate to root - should redirect to /login ONCE
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });

    // Wait a bit to ensure no redirect loop
    await page.waitForTimeout(3000);

    // Count redirects to login page
    const loginRedirects = navigationEvents.filter(url => url.includes('/login')).length;

    console.log('Navigation events:', navigationEvents);
    console.log('Login redirects count:', loginRedirects);

    // Should have at most 2 redirects (initial + one redirect)
    expect(loginRedirects).toBeLessThanOrEqual(2);

    // Should end on login page
    expect(page.url()).toContain('/login');

    await page.screenshot({ path: 'screenshots/redirect-loop-test.png', fullPage: true });
  });

  test('should select project from dropdown', async ({ page }) => {
    // Login first
    await page.goto(`${FRONTEND_URL}/login`);
    await page.locator('#apiKey').fill(TEST_API_KEY);
    await page.locator('button[type="submit"]').click();

    // Wait for navigation away from login
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    // Find and click project selector
    const projectSelector = page.locator('select, [data-testid="project-selector"]').first();

    if (await projectSelector.isVisible()) {
      await page.screenshot({ path: 'screenshots/project-selector-before.png', fullPage: true });

      // Click to open dropdown
      await projectSelector.click();
      await page.waitForTimeout(500);

      await page.screenshot({ path: 'screenshots/project-selector-open.png', fullPage: true });

      // Check if there are options
      const options = await page.locator('select option, [role="option"]').count();
      console.log('Project options count:', options);

      expect(options).toBeGreaterThan(0);
    } else {
      // Check for alternative project selector UI
      const altSelector = page.locator('text=Select Project').first();
      if (await altSelector.isVisible()) {
        await altSelector.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/project-selector-alt.png', fullPage: true });
      }
    }
  });
});
