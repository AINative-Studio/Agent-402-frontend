import { test } from '@playwright/test';

test.setTimeout(120000);

test('Debug Page Load', async ({ page }) => {
  // Enable verbose logging
  page.on('console', msg => console.log(`[Console ${msg.type()}] ${msg.text()}`));
  page.on('pageerror', error => console.log(`[Page Error] ${error.message}`));
  page.on('requestfailed', request => console.log(`[Request Failed] ${request.url()} - ${request.failure()?.errorText}`));

  console.log('Navigating to http://localhost:5173...');

  // Try a simple navigation
  const response = await page.goto('http://localhost:5173', {
    waitUntil: 'commit',
    timeout: 60000
  });

  console.log(`Response status: ${response?.status()}`);
  console.log(`Response URL: ${response?.url()}`);

  // Wait a moment
  await page.waitForTimeout(5000);

  // Get raw HTML
  const html = await page.content();
  console.log(`Page HTML length: ${html.length}`);
  console.log(`HTML preview: ${html.substring(0, 500)}`);

  // Check if #root exists at all
  const rootExists = await page.locator('#root').count();
  console.log(`#root count: ${rootExists}`);

  // Get #root content
  const rootContent = await page.locator('#root').innerHTML().catch(() => 'ERROR');
  console.log(`#root innerHTML: ${rootContent.substring(0, 200)}`);

  // Take screenshot
  await page.screenshot({ path: 'screenshots/debug-page.png', fullPage: true });
  console.log('Screenshot saved to screenshots/debug-page.png');

  // Wait longer for React
  console.log('Waiting 10 more seconds for React to hydrate...');
  await page.waitForTimeout(10000);

  // Check again
  const rootContent2 = await page.locator('#root').innerHTML().catch(() => 'ERROR');
  console.log(`#root innerHTML after wait: ${rootContent2.substring(0, 200)}`);

  await page.screenshot({ path: 'screenshots/debug-page-after-wait.png', fullPage: true });
});
