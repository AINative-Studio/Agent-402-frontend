import { test } from '@playwright/test';

// Test configuration
const FRONTEND_URL = 'http://localhost:5173';
const TEST_API_KEY = 'demo_key_user1_abc123';

// Increase timeout for all tests
test.setTimeout(60000);

// Helper to collect console errors
let consoleErrors: string[] = [];
let networkErrors: string[] = [];

test.describe('Agent402 Frontend E2E Tests', () => {
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
  });

  test('1. Login Flow Test', async ({ page }) => {
    console.log('=== TEST 1: Login Flow ===');

    // Navigate to frontend with domcontentloaded (faster than load)
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for React to hydrate
    await page.waitForSelector('#root', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Take screenshot of initial page
    await page.screenshot({ path: 'screenshots/01-initial-page.png', fullPage: true });
    console.log('Screenshot: 01-initial-page.png');

    // Check current URL
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Check if we're on login page (should redirect from protected route)
    const isOnLoginPage = currentUrl.includes('/login');
    console.log(`On login page: ${isOnLoginPage}`);

    if (isOnLoginPage) {
      console.log('Correctly redirected to login page');
    }

    // Wait for login page elements - using the exact selectors from Login.tsx
    await page.screenshot({ path: 'screenshots/02-login-page.png', fullPage: true });

    // Find the API key input (it's type="password" with id="apiKey")
    const apiKeyInput = page.locator('#apiKey');
    const inputVisible = await apiKeyInput.isVisible().catch(() => false);
    console.log(`API Key input visible: ${inputVisible}`);

    if (inputVisible) {
      // Fill the API key
      await apiKeyInput.fill(TEST_API_KEY);
      console.log('Entered API key');

      // Take screenshot after entering key
      await page.screenshot({ path: 'screenshots/03-api-key-entered.png', fullPage: true });

      // Find and click login button
      const loginButton = page.locator('button[type="submit"]');
      await loginButton.click();
      console.log('Clicked login button');

      // Wait for navigation after login
      await page.waitForTimeout(3000);
      await page.waitForLoadState('domcontentloaded');

      // Take screenshot after login
      await page.screenshot({ path: 'screenshots/04-after-login.png', fullPage: true });
      console.log(`URL after login: ${page.url()}`);

      // Verify we're not on login page anymore
      const afterLoginUrl = page.url();
      if (!afterLoginUrl.includes('/login')) {
        console.log('[PASS] Successfully logged in and redirected');
      } else {
        console.log('[FAIL] Still on login page after login attempt');
      }
    } else {
      console.log('[WARN] API Key input not found - checking page state');
      await page.screenshot({ path: 'screenshots/02-no-input-found.png', fullPage: true });

      // Try to get page content
      const bodyText = await page.textContent('body');
      console.log(`Page content (first 500 chars): ${bodyText?.substring(0, 500)}`);
    }

    // Report console errors
    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors during Login Flow:');
      consoleErrors.forEach(e => console.log(e));
    }
    if (networkErrors.length > 0) {
      console.log('\nNetwork Errors during Login Flow:');
      networkErrors.forEach(e => console.log(e));
    }
  });

  test('2. Overview Page Test', async ({ page }) => {
    console.log('\n=== TEST 2: Overview Page ===');

    // Login first
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#root', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Fill login form
    const apiKeyInput = page.locator('#apiKey');
    if (await apiKeyInput.isVisible().catch(() => false)) {
      await apiKeyInput.fill(TEST_API_KEY);
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(3000);
    }

    // Navigate to overview
    await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Take screenshot of overview page
    await page.screenshot({ path: 'screenshots/05-overview-page.png', fullPage: true });
    console.log('Screenshot: 05-overview-page.png');

    // Check for stats/dashboard elements
    const pageContent = await page.textContent('body');
    console.log(`Overview page loaded. Content sample: ${pageContent?.substring(0, 300)}...`);

    // Look for common dashboard elements
    const hasStats = pageContent?.toLowerCase().includes('stat') ||
                     pageContent?.toLowerCase().includes('total') ||
                     pageContent?.toLowerCase().includes('overview');
    console.log(`Dashboard content detected: ${hasStats}`);

    // Report errors
    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors on Overview Page:');
      consoleErrors.forEach(e => console.log(e));
    }
  });

  test('3. Navigation Test', async ({ page }) => {
    console.log('\n=== TEST 3: Navigation Test ===');

    // Login first
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#root', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const apiKeyInput = page.locator('#apiKey');
    if (await apiKeyInput.isVisible().catch(() => false)) {
      await apiKeyInput.fill(TEST_API_KEY);
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(3000);
    }

    // Test navigation items
    const navItems = [
      { name: 'Runs', expectedPath: '/runs' },
      { name: 'Agents', expectedPath: '/agents' },
      { name: 'Embeddings', expectedPath: '/embeddings' },
      { name: 'Tables', expectedPath: '/tables' }
    ];

    for (const item of navItems) {
      console.log(`\nNavigating to: ${item.name}`);

      // Try multiple selector strategies
      let navLink = page.locator(`a:has-text("${item.name}")`).first();

      if (!await navLink.isVisible().catch(() => false)) {
        navLink = page.locator(`button:has-text("${item.name}")`).first();
      }
      if (!await navLink.isVisible().catch(() => false)) {
        navLink = page.locator(`[role="navigation"] >> text=${item.name}`).first();
      }
      if (!await navLink.isVisible().catch(() => false)) {
        navLink = page.locator(`text=${item.name}`).first();
      }

      if (await navLink.isVisible().catch(() => false)) {
        await navLink.click();
        await page.waitForTimeout(2000);

        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);

        // Take screenshot
        const screenshotName = `screenshots/06-nav-${item.name.toLowerCase()}.png`;
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
        await page.screenshot({ path: `screenshots/06-nav-${item.name.toLowerCase()}-fail.png`, fullPage: true });
      }
    }

    // Report errors
    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors during Navigation:');
      consoleErrors.forEach(e => console.log(e));
    }
  });

  test('4. Project Selector Test', async ({ page }) => {
    console.log('\n=== TEST 4: Project Selector Test ===');

    // Login first
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#root', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const apiKeyInput = page.locator('#apiKey');
    if (await apiKeyInput.isVisible().catch(() => false)) {
      await apiKeyInput.fill(TEST_API_KEY);
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(3000);
    }

    // Navigate to main page
    await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for project selector in sidebar
    const projectSelector = page.locator('select, [role="combobox"], [data-testid*="project"]').first();

    if (await projectSelector.isVisible().catch(() => false)) {
      console.log('[PASS] Project selector is visible');
      await page.screenshot({ path: 'screenshots/07-project-selector.png', fullPage: true });

      // Try to interact with it
      await projectSelector.click().catch(() => console.log('Could not click project selector'));
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/08-project-selector-open.png', fullPage: true });
    } else {
      console.log('[WARN] Standard project selector not found');

      // Check for sidebar content
      const sidebarContent = await page.locator('aside, nav, [class*="sidebar"]').first().textContent().catch(() => '');
      console.log(`Sidebar content: ${sidebarContent?.substring(0, 200)}`);

      await page.screenshot({ path: 'screenshots/07-sidebar-state.png', fullPage: true });
    }

    // Report errors
    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors during Project Selector Test:');
      consoleErrors.forEach(e => console.log(e));
    }
    if (networkErrors.length > 0) {
      console.log('\nNetwork Errors during Project Selector Test:');
      networkErrors.forEach(e => console.log(e));
    }
  });

  test('5. Console Error Check', async ({ page }) => {
    console.log('\n=== TEST 5: Console Error Check ===');

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

    // Login first
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#root', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const apiKeyInput = page.locator('#apiKey');
    if (await apiKeyInput.isVisible().catch(() => false)) {
      await apiKeyInput.fill(TEST_API_KEY);
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(3000);
    }

    // Navigate to each page to collect errors
    const pages = ['/', '/runs', '/agents', '/embeddings', '/tables'];
    for (const p of pages) {
      console.log(`Visiting: ${p}`);
      await page.goto(`${FRONTEND_URL}${p}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
    }

    // Report all collected errors
    console.log('\n=== ERROR SUMMARY ===');
    console.log(`Total Console Errors: ${allErrors.length}`);
    console.log(`Total Network Errors: ${allNetworkErrors.length}`);

    if (allErrors.length > 0) {
      console.log('\nConsole Errors:');
      allErrors.forEach(e => console.log(e));
    }

    if (allNetworkErrors.length > 0) {
      console.log('\nNetwork Errors:');
      allNetworkErrors.forEach(e => console.log(e));
    }

    // Take final screenshot
    await page.screenshot({ path: 'screenshots/09-final-state.png', fullPage: true });
  });
});
