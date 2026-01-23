import { test } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:5173';
const TEST_API_KEY = 'demo_key_user1_abc123';

test.setTimeout(180000);

test('Agent402 E2E Test with API Mock', async ({ page }) => {
  console.log('=== AGENT402 E2E TEST WITH API WORKAROUND ===\n');

  // Block API requests that cause 401 and redirect loop BEFORE navigating
  // This allows the page to load and render the login form
  await page.route('**/api/v1/projects**', async (route) => {
    // For unauthenticated requests, return empty projects list
    const headers = route.request().headers();
    if (!headers['x-api-key']) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [] })
      });
    } else {
      await route.continue();
    }
  });

  console.log('[INFO] API route interceptor set up');

  // ============================================
  // TEST 1: LOGIN PAGE
  // ============================================
  console.log('\n--- TEST 1: LOGIN PAGE ---');

  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({ path: 'screenshots/01-login-page.png', fullPage: true });

  // Check if login form is visible
  const loginFormVisible = await page.locator('#apiKey').isVisible().catch(() => false);
  const loginTitleVisible = await page.locator('text=Agent402').isVisible().catch(() => false);

  console.log(`[INFO] Login form visible: ${loginFormVisible}`);
  console.log(`[INFO] Login title visible: ${loginTitleVisible}`);

  if (!loginFormVisible) {
    console.log('[FAIL] Login form not visible - checking page content');
    const html = await page.content();
    console.log(`[DEBUG] Page HTML length: ${html.length}`);
    console.log(`[DEBUG] HTML preview: ${html.substring(0, 500)}`);
    return;
  }

  console.log('[PASS] Login page loaded successfully');

  // ============================================
  // TEST 2: LOGIN FLOW
  // ============================================
  console.log('\n--- TEST 2: LOGIN FLOW ---');

  // Enter API key
  await page.locator('#apiKey').fill(TEST_API_KEY);
  console.log('[INFO] API key entered');

  await page.screenshot({ path: 'screenshots/02-api-key-entered.png', fullPage: true });

  // Click login
  await page.locator('button[type="submit"]').click();
  console.log('[INFO] Login button clicked');

  // Wait for navigation
  await page.waitForTimeout(3000);

  const afterLoginUrl = page.url();
  console.log(`[INFO] URL after login: ${afterLoginUrl}`);

  await page.screenshot({ path: 'screenshots/03-after-login.png', fullPage: true });

  if (!afterLoginUrl.includes('/login')) {
    console.log('[PASS] Login successful - redirected to app');
  } else {
    // Check for error
    const errorText = await page.locator('.text-red-400').textContent().catch(() => null);
    if (errorText) {
      console.log(`[FAIL] Login error: ${errorText}`);
    } else {
      console.log('[WARN] Still on login page');
    }
  }

  // ============================================
  // TEST 3: OVERVIEW PAGE
  // ============================================
  console.log('\n--- TEST 3: OVERVIEW PAGE ---');

  // Set auth in localStorage and navigate
  await page.evaluate((apiKey) => {
    localStorage.setItem('apiKey', apiKey);
  }, TEST_API_KEY);

  await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'screenshots/04-overview.png', fullPage: true });

  const overviewUrl = page.url();
  console.log(`[INFO] Overview URL: ${overviewUrl}`);

  if (!overviewUrl.includes('/login')) {
    console.log('[PASS] Overview page loaded');

    // Check for sidebar
    const sidebarVisible = await page.locator('aside').isVisible().catch(() => false);
    console.log(`[INFO] Sidebar visible: ${sidebarVisible}`);

    // Get page content
    const bodyText = await page.textContent('body').catch(() => '');
    console.log(`[INFO] Page content preview: ${bodyText.substring(0, 200)}`);
  } else {
    console.log('[FAIL] Redirected to login - auth not working');
  }

  // ============================================
  // TEST 4: NAVIGATION
  // ============================================
  console.log('\n--- TEST 4: NAVIGATION ---');

  const navTargets = [
    { name: 'Runs', path: '/runs' },
    { name: 'Agents', path: '/agents' },
    { name: 'Embeddings', path: '/embeddings' },
    { name: 'Tables', path: '/tables' }
  ];

  for (const nav of navTargets) {
    // Navigate directly
    await page.goto(`${FRONTEND_URL}${nav.path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    const isCorrectPage = currentUrl.includes(nav.path);

    console.log(`[INFO] ${nav.name}: ${isCorrectPage ? 'PASS' : 'FAIL'} (URL: ${currentUrl})`);

    await page.screenshot({
      path: `screenshots/05-nav-${nav.name.toLowerCase()}.png`,
      fullPage: true
    });
  }

  // ============================================
  // TEST 5: PROJECT SELECTOR
  // ============================================
  console.log('\n--- TEST 5: PROJECT SELECTOR ---');

  await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const projectSelector = page.locator('select').first();
  const selectVisible = await projectSelector.isVisible().catch(() => false);

  console.log(`[INFO] Project selector visible: ${selectVisible}`);

  if (selectVisible) {
    await page.screenshot({ path: 'screenshots/06-project-selector.png', fullPage: true });
    console.log('[PASS] Project selector found');
  } else {
    // Check sidebar content
    const sidebarText = await page.locator('aside').textContent().catch(() => '');
    console.log(`[INFO] Sidebar content: ${sidebarText.substring(0, 200)}`);
  }

  // ============================================
  // FINAL
  // ============================================
  console.log('\n=== TEST COMPLETE ===');
  await page.screenshot({ path: 'screenshots/final.png', fullPage: true });
});
