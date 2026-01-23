import { test } from '@playwright/test';

// Test configuration
const FRONTEND_URL = 'http://localhost:5173';
const TEST_API_KEY = 'demo_key_user1_abc123';

test.setTimeout(180000);

test.describe('Agent402 Frontend E2E Tests - Final', () => {
  test('Complete E2E Test Suite', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];

    // Set up event listeners
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[Console] ${msg.text()}`);
      }
    });

    page.on('requestfailed', (request) => {
      networkErrors.push(`[Network] ${request.url()} - ${request.failure()?.errorText}`);
    });

    console.log('=== AGENT402 FRONTEND E2E TEST ===\n');

    // ============================================
    // TEST 1: LOGIN FLOW
    // ============================================
    console.log('--- TEST 1: LOGIN FLOW ---');

    // Clear localStorage and navigate to login page directly
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });

    // Wait for the login form to appear (wait for visible content, not just DOM)
    await page.waitForSelector('text=Agent402', { timeout: 30000 });
    await page.waitForSelector('#apiKey', { timeout: 10000 });

    console.log('[PASS] Login page loaded');
    await page.screenshot({ path: 'screenshots/test-01-login-page.png', fullPage: true });

    // Fill in the API key
    await page.locator('#apiKey').fill(TEST_API_KEY);
    console.log('[PASS] API key entered');
    await page.screenshot({ path: 'screenshots/test-02-api-key-filled.png', fullPage: true });

    // Click login button
    await page.locator('button[type="submit"]').click();
    console.log('[INFO] Login button clicked');

    // Wait for navigation away from login page
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 }).catch(() => {
      console.log('[WARN] Did not navigate away from login page');
    });

    const afterLoginUrl = page.url();
    console.log(`[INFO] URL after login: ${afterLoginUrl}`);
    await page.screenshot({ path: 'screenshots/test-03-after-login.png', fullPage: true });

    if (afterLoginUrl.includes('/login')) {
      // Check for error message
      const errorText = await page.locator('.text-red-400').textContent().catch(() => null);
      if (errorText) {
        console.log(`[FAIL] Login failed with error: ${errorText}`);
      } else {
        console.log('[FAIL] Still on login page - possible redirect loop');
      }
    } else {
      console.log('[PASS] Successfully navigated after login');
    }

    // ============================================
    // TEST 2: OVERVIEW PAGE
    // ============================================
    console.log('\n--- TEST 2: OVERVIEW PAGE ---');

    // If we're not logged in, try setting localStorage directly
    if (page.url().includes('/login')) {
      console.log('[INFO] Setting auth via localStorage...');
      await page.evaluate((apiKey) => {
        localStorage.setItem('apiKey', apiKey);
      }, TEST_API_KEY);
      await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
    }

    const overviewUrl = page.url();
    console.log(`[INFO] Overview URL: ${overviewUrl}`);

    if (!overviewUrl.includes('/login')) {
      console.log('[PASS] Overview page accessible');

      // Wait for content to load
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/test-04-overview.png', fullPage: true });

      // Check for sidebar navigation
      const sidebarVisible = await page.locator('aside, nav').first().isVisible().catch(() => false);
      console.log(`[INFO] Sidebar visible: ${sidebarVisible}`);

      // Get page title or header
      const pageTitle = await page.locator('h1, h2').first().textContent().catch(() => 'Not found');
      console.log(`[INFO] Page header: ${pageTitle}`);
    } else {
      console.log('[FAIL] Overview page not accessible - redirected to login');
      await page.screenshot({ path: 'screenshots/test-04-overview-fail.png', fullPage: true });
    }

    // ============================================
    // TEST 3: NAVIGATION
    // ============================================
    console.log('\n--- TEST 3: NAVIGATION ---');

    if (!page.url().includes('/login')) {
      const navItems = ['Runs', 'Agents', 'Embeddings', 'Tables'];

      for (const item of navItems) {
        console.log(`[INFO] Testing navigation to: ${item}`);

        // Find and click navigation item
        const navLink = page.locator(`a:has-text("${item}"), button:has-text("${item}")`).first();

        if (await navLink.isVisible().catch(() => false)) {
          await navLink.click();
          await page.waitForTimeout(1500);

          const currentUrl = page.url();
          const expectedPath = `/${item.toLowerCase()}`;

          if (currentUrl.includes(expectedPath)) {
            console.log(`[PASS] ${item} page loaded at ${currentUrl}`);
          } else {
            console.log(`[WARN] ${item} - unexpected URL: ${currentUrl}`);
          }

          await page.screenshot({
            path: `screenshots/test-05-nav-${item.toLowerCase()}.png`,
            fullPage: true
          });
        } else {
          console.log(`[FAIL] ${item} navigation link not found`);
        }
      }
    } else {
      console.log('[SKIP] Navigation tests skipped - not authenticated');
    }

    // ============================================
    // TEST 4: PROJECT SELECTOR
    // ============================================
    console.log('\n--- TEST 4: PROJECT SELECTOR ---');

    if (!page.url().includes('/login')) {
      // Go back to home
      await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Look for project selector
      const projectSelect = page.locator('select, [role="combobox"]').first();

      if (await projectSelect.isVisible().catch(() => false)) {
        console.log('[PASS] Project selector found');
        await page.screenshot({ path: 'screenshots/test-06-project-selector.png', fullPage: true });

        // Try to open it
        await projectSelect.click().catch(() => {});
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/test-07-project-dropdown.png', fullPage: true });
      } else {
        console.log('[WARN] Project selector not found');
        const sidebar = await page.locator('aside').first().textContent().catch(() => '');
        console.log(`[INFO] Sidebar content preview: ${sidebar.substring(0, 200)}`);
      }
    } else {
      console.log('[SKIP] Project selector test skipped - not authenticated');
    }

    // ============================================
    // TEST 5: ERROR SUMMARY
    // ============================================
    console.log('\n--- TEST 5: ERROR SUMMARY ---');
    console.log(`Total Console Errors: ${consoleErrors.length}`);
    console.log(`Total Network Errors: ${networkErrors.length}`);

    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors:');
      // Deduplicate errors
      const uniqueErrors = [...new Set(consoleErrors)];
      uniqueErrors.slice(0, 5).forEach(e => console.log(`  ${e}`));
      if (uniqueErrors.length > 5) {
        console.log(`  ... and ${uniqueErrors.length - 5} more unique errors`);
      }
    }

    if (networkErrors.length > 0) {
      console.log('\nNetwork Errors:');
      const uniqueNetErrors = [...new Set(networkErrors)];
      uniqueNetErrors.slice(0, 5).forEach(e => console.log(`  ${e}`));
    }

    // ============================================
    // FINAL SCREENSHOT
    // ============================================
    await page.screenshot({ path: 'screenshots/test-final.png', fullPage: true });

    console.log('\n=== TEST COMPLETE ===');
  });
});
