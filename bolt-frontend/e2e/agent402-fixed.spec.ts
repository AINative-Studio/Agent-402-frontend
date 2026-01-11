import { test, expect, Page } from '@playwright/test';

// Test configuration
const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:8000';
const TEST_API_KEY = 'demo_key_user1_abc123';

// Increase timeout for all tests
test.setTimeout(120000);

// Test utilities
async function waitForStableUrl(page: Page, maxAttempts = 10): Promise<string> {
  let lastUrl = '';
  let stableCount = 0;

  for (let i = 0; i < maxAttempts; i++) {
    await page.waitForTimeout(500);
    const currentUrl = page.url();
    if (currentUrl === lastUrl) {
      stableCount++;
      if (stableCount >= 3) {
        return currentUrl;
      }
    } else {
      stableCount = 0;
      lastUrl = currentUrl;
    }
  }
  return lastUrl;
}

test.describe('Agent402 Frontend E2E Tests', () => {
  let consoleErrors: string[] = [];
  let networkErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset error collectors
    consoleErrors = [];
    networkErrors = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[Console Error] ${msg.text()}`);
      }
    });

    // Listen for network failures
    page.on('requestfailed', (request) => {
      networkErrors.push(`[Network Error] ${request.url()} - ${request.failure()?.errorText}`);
    });

    // Clear any existing auth state by clearing localStorage before each test
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  test('1. Login Flow Test', async ({ page }) => {
    console.log('=== TEST 1: Login Flow ===');

    // CRITICAL: Navigate directly to /login to avoid the redirect loop
    // The redirect loop happens because:
    // 1. Protected route redirects to /login
    // 2. ProjectContext tries to fetch projects
    // 3. API returns 401 (no auth)
    // 4. apiClient interceptor does window.location.href = '/login'
    // 5. Page reloads, repeat from step 1

    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for page to stabilize
    const stableUrl = await waitForStableUrl(page);
    console.log(`Stable URL: ${stableUrl}`);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/01-login-page.png', fullPage: true });
    console.log('Screenshot: 01-login-page.png');

    // Check if we're on login page
    const isOnLoginPage = stableUrl.includes('/login');
    console.log(`On login page: ${isOnLoginPage}`);

    if (!isOnLoginPage) {
      console.log('[FAIL] Not on login page - redirect loop detected');
      return;
    }

    // Wait for the login form to be visible
    const apiKeyInput = page.locator('#apiKey');
    try {
      await apiKeyInput.waitFor({ state: 'visible', timeout: 10000 });
      console.log('[PASS] API Key input is visible');
    } catch (e) {
      console.log('[FAIL] API Key input not found');
      // Try to capture current state
      const bodyText = await page.textContent('body').catch(() => 'Unable to get body text');
      console.log(`Page content: ${bodyText?.substring(0, 500)}`);
      await page.screenshot({ path: 'screenshots/01-login-error.png', fullPage: true });
      return;
    }

    // Fill the API key
    await apiKeyInput.fill(TEST_API_KEY);
    console.log('Entered API key');

    // Take screenshot after entering key
    await page.screenshot({ path: 'screenshots/02-api-key-entered.png', fullPage: true });

    // Find and click login button
    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();
    console.log('Clicked login button');

    // Wait for navigation after login
    await page.waitForTimeout(2000);

    // Wait for URL to stabilize (should redirect to / after login)
    const afterLoginUrl = await waitForStableUrl(page);
    console.log(`URL after login: ${afterLoginUrl}`);

    // Take screenshot after login
    await page.screenshot({ path: 'screenshots/03-after-login.png', fullPage: true });

    // Verify we're not on login page anymore
    if (!afterLoginUrl.includes('/login')) {
      console.log('[PASS] Successfully logged in and redirected');
    } else {
      console.log('[FAIL] Still on login page after login attempt');
      // Check for error message
      const errorMsg = await page.textContent('.text-red-400').catch(() => null);
      if (errorMsg) {
        console.log(`Login error: ${errorMsg}`);
      }
    }

    // Report console errors
    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors during Login Flow:');
      consoleErrors.slice(0, 5).forEach(e => console.log(e));
      if (consoleErrors.length > 5) {
        console.log(`... and ${consoleErrors.length - 5} more errors`);
      }
    }
  });

  test('2. Overview Page Test (after login)', async ({ page }) => {
    console.log('\n=== TEST 2: Overview Page ===');

    // Set API key directly in localStorage before navigation
    await page.addInitScript((apiKey) => {
      window.localStorage.setItem('apiKey', apiKey);
    }, TEST_API_KEY);

    // Navigate to overview page
    await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for page to stabilize
    const stableUrl = await waitForStableUrl(page);
    console.log(`Stable URL: ${stableUrl}`);

    // If redirected to login, auth didn't work
    if (stableUrl.includes('/login')) {
      console.log('[FAIL] Redirected to login - auth may have failed');
      await page.screenshot({ path: 'screenshots/04-overview-redirected.png', fullPage: true });
      return;
    }

    // Take screenshot of overview page
    await page.screenshot({ path: 'screenshots/04-overview-page.png', fullPage: true });
    console.log('Screenshot: 04-overview-page.png');

    // Check for overview page content
    const pageContent = await page.textContent('body').catch(() => '');
    console.log(`Overview page content (first 300 chars): ${pageContent?.substring(0, 300)}...`);

    // Look for common dashboard elements
    const hasOverviewContent =
      pageContent?.toLowerCase().includes('overview') ||
      pageContent?.toLowerCase().includes('dashboard') ||
      pageContent?.toLowerCase().includes('runs') ||
      pageContent?.toLowerCase().includes('agents');

    if (hasOverviewContent) {
      console.log('[PASS] Overview page content detected');
    } else {
      console.log('[WARN] Expected overview content not found');
    }

    // Report errors
    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors on Overview Page:');
      consoleErrors.slice(0, 5).forEach(e => console.log(e));
    }
  });

  test('3. Navigation Test (after login)', async ({ page }) => {
    console.log('\n=== TEST 3: Navigation Test ===');

    // Set API key directly in localStorage before navigation
    await page.addInitScript((apiKey) => {
      window.localStorage.setItem('apiKey', apiKey);
    }, TEST_API_KEY);

    // Navigate to home
    await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForStableUrl(page);
    await page.waitForTimeout(2000);

    // Test navigation items
    const navItems = [
      { name: 'Runs', expectedPath: '/runs' },
      { name: 'Agents', expectedPath: '/agents' },
      { name: 'Embeddings', expectedPath: '/embeddings' },
      { name: 'Tables', expectedPath: '/tables' }
    ];

    for (const item of navItems) {
      console.log(`\nNavigating to: ${item.name}`);

      // Try to find the nav link using various strategies
      const selectors = [
        `a:has-text("${item.name}")`,
        `button:has-text("${item.name}")`,
        `[role="link"]:has-text("${item.name}")`,
        `text=${item.name}`
      ];

      let navLink = null;
      for (const selector of selectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible().catch(() => false)) {
          navLink = element;
          break;
        }
      }

      if (navLink) {
        await navLink.click();
        await page.waitForTimeout(1500);

        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);

        // Take screenshot
        const screenshotName = `screenshots/05-nav-${item.name.toLowerCase()}.png`;
        await page.screenshot({ path: screenshotName, fullPage: true });
        console.log(`Screenshot: ${screenshotName}`);

        // Verify URL
        if (currentUrl.includes(item.expectedPath)) {
          console.log(`[PASS] ${item.name} page loaded correctly`);
        } else {
          console.log(`[WARN] ${item.name} page URL mismatch. Expected: ${item.expectedPath}, Got: ${currentUrl}`);
        }
      } else {
        console.log(`[FAIL] Could not find navigation link for: ${item.name}`);
        await page.screenshot({ path: `screenshots/05-nav-${item.name.toLowerCase()}-fail.png`, fullPage: true });
      }
    }

    // Report errors
    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors during Navigation:');
      consoleErrors.slice(0, 5).forEach(e => console.log(e));
    }
  });

  test('4. Project Selector Test (after login)', async ({ page }) => {
    console.log('\n=== TEST 4: Project Selector Test ===');

    // Set API key directly in localStorage before navigation
    await page.addInitScript((apiKey) => {
      window.localStorage.setItem('apiKey', apiKey);
    }, TEST_API_KEY);

    // Navigate to home
    await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForStableUrl(page);
    await page.waitForTimeout(3000);

    // Take screenshot of current state
    await page.screenshot({ path: 'screenshots/06-project-selector-search.png', fullPage: true });

    // Look for project selector
    const projectSelectors = [
      'select',
      '[role="combobox"]',
      '[data-testid*="project"]',
      '[class*="project"]'
    ];

    let selectorFound = false;
    for (const sel of projectSelectors) {
      const element = page.locator(sel).first();
      if (await element.isVisible().catch(() => false)) {
        console.log(`[PASS] Found project selector with: ${sel}`);
        selectorFound = true;

        // Try to interact with it
        await element.click().catch(() => console.log('Could not click project selector'));
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/07-project-selector-open.png', fullPage: true });
        break;
      }
    }

    if (!selectorFound) {
      console.log('[WARN] Project selector not found with standard selectors');

      // Get sidebar content for debugging
      const sidebarContent = await page.locator('aside, nav').first().textContent().catch(() => '');
      console.log(`Sidebar content: ${sidebarContent?.substring(0, 300)}`);

      await page.screenshot({ path: 'screenshots/06-sidebar-state.png', fullPage: true });
    }

    // Report errors
    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors:');
      consoleErrors.slice(0, 5).forEach(e => console.log(e));
    }
    if (networkErrors.length > 0) {
      console.log('\nNetwork Errors:');
      networkErrors.slice(0, 5).forEach(e => console.log(e));
    }
  });

  test('5. Console Error Summary', async ({ page }) => {
    console.log('\n=== TEST 5: Console Error Summary ===');

    const allErrors: string[] = [];
    const allNetworkErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        allErrors.push(`[${msg.type()}] ${msg.text()}`);
      }
    });

    page.on('requestfailed', (request) => {
      allNetworkErrors.push(`[Network] ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });

    // Set API key
    await page.addInitScript((apiKey) => {
      window.localStorage.setItem('apiKey', apiKey);
    }, TEST_API_KEY);

    // Visit each page
    const pagesToVisit = ['/', '/runs', '/agents', '/embeddings', '/tables'];

    for (const p of pagesToVisit) {
      console.log(`Visiting: ${p}`);
      await page.goto(`${FRONTEND_URL}${p}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
    }

    // Report all collected errors
    console.log('\n=== ERROR SUMMARY ===');
    console.log(`Total Console Errors: ${allErrors.length}`);
    console.log(`Total Network Errors: ${allNetworkErrors.length}`);

    if (allErrors.length > 0) {
      console.log('\nConsole Errors (first 10):');
      allErrors.slice(0, 10).forEach(e => console.log(e));
      if (allErrors.length > 10) {
        console.log(`... and ${allErrors.length - 10} more`);
      }
    } else {
      console.log('\n[PASS] No console errors detected');
    }

    if (allNetworkErrors.length > 0) {
      console.log('\nNetwork Errors (first 10):');
      allNetworkErrors.slice(0, 10).forEach(e => console.log(e));
    } else {
      console.log('\n[PASS] No network errors detected');
    }

    // Take final screenshot
    await page.screenshot({ path: 'screenshots/08-final-state.png', fullPage: true });
  });
});
