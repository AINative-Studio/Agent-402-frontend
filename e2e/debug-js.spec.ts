import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:5173';

test.setTimeout(120000);

test('Debug React Mounting', async ({ page }) => {
  const logs: string[] = [];
  const errors: string[] = [];

  page.on('console', (msg) => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', (error) => {
    errors.push(`[PageError] ${error.message}\n${error.stack}`);
  });

  console.log('Navigating to frontend...');

  await page.goto(FRONTEND_URL, { waitUntil: 'commit' });

  // Wait and collect logs
  await page.waitForTimeout(5000);

  console.log('\n=== CONSOLE LOGS ===');
  logs.forEach(log => console.log(log));

  console.log('\n=== ERRORS ===');
  errors.forEach(err => console.log(err));

  // Check #root content
  const rootContent = await page.locator('#root').innerHTML().catch(() => 'ERROR getting innerHTML');
  console.log(`\n=== #root innerHTML ===\n${rootContent}`);

  // Check if there's any content in body
  const bodyText = await page.textContent('body').catch(() => 'ERROR');
  console.log(`\n=== body textContent ===\n${bodyText}`);

  // Take screenshot
  await page.screenshot({ path: 'screenshots/debug-js.png', fullPage: true });
});
