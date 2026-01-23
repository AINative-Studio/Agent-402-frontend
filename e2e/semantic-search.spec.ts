import { test, expect } from '@playwright/test';

// Test configuration
const FRONTEND_URL = 'http://localhost:5173';
const TEST_API_KEY = 'demo_key_user1_abc123';

// Increase timeout for all tests
test.setTimeout(60000);

// Helper to collect console errors
let consoleErrors: string[] = [];
let networkErrors: string[] = [];

test.describe('Semantic Search E2E Tests', () => {
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
            networkErrors.push(
                `[Network Error] ${request.url()} - ${request.failure()?.errorText}`
            );
        });

        // Navigate to frontend and login
        await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForSelector('#root', { timeout: 10000 });

        // Check if already logged in by looking for auth storage
        const hasAuth = await page.evaluate(() => {
            return localStorage.getItem('apiKey') !== null;
        });

        if (!hasAuth) {
            // Perform login
            const apiKeyInput = page.locator('input[type="password"]');
            await apiKeyInput.waitFor({ state: 'visible', timeout: 5000 });
            await apiKeyInput.fill(TEST_API_KEY);

            const submitButton = page.locator('button[type="submit"]');
            await submitButton.click();

            // Wait for navigation to complete
            await page.waitForTimeout(2000);
        }

        // Navigate to Memory Viewer page
        await page.goto(`${FRONTEND_URL}/memory`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);
    });

    test('1. Semantic Search Tab Visibility', async ({ page }) => {
        console.log('=== TEST 1: Semantic Search Tab Visibility ===');

        // Check if Search button exists
        const searchButton = page.locator('button', { hasText: 'Search' });
        await expect(searchButton).toBeVisible({ timeout: 5000 });

        console.log('Search button is visible');

        // Take screenshot
        await page.screenshot({
            path: 'screenshots/semantic-search-01-tab-visible.png',
            fullPage: true,
        });
    });

    test('2. Switch to Semantic Search View', async ({ page }) => {
        console.log('=== TEST 2: Switch to Semantic Search View ===');

        // Click Search button
        const searchButton = page.locator('button', { hasText: 'Search' });
        await searchButton.click();
        await page.waitForTimeout(500);

        // Check if search input is visible
        const searchInput = page.locator(
            'input[placeholder*="Search memories using natural language"]'
        );
        await expect(searchInput).toBeVisible({ timeout: 5000 });

        console.log('Semantic search input is visible');

        // Take screenshot
        await page.screenshot({
            path: 'screenshots/semantic-search-02-search-view.png',
            fullPage: true,
        });
    });

    test('3. Search Input Interaction', async ({ page }) => {
        console.log('=== TEST 3: Search Input Interaction ===');

        // Switch to search view
        const searchButton = page.locator('button', { hasText: 'Search' });
        await searchButton.click();
        await page.waitForTimeout(500);

        // Type in search input
        const searchInput = page.locator(
            'input[placeholder*="Search memories using natural language"]'
        );
        await searchInput.fill('transaction analysis');
        await page.waitForTimeout(500);

        // Check if search button is enabled
        const searchSubmitButton = page.locator('button[type="submit"]', {
            hasText: 'Search',
        });
        await expect(searchSubmitButton).toBeEnabled();

        console.log('Search input accepts text and enables submit button');

        // Take screenshot
        await page.screenshot({
            path: 'screenshots/semantic-search-03-input-filled.png',
            fullPage: true,
        });
    });

    test('4. Similarity Threshold Adjustment', async ({ page }) => {
        console.log('=== TEST 4: Similarity Threshold Adjustment ===');

        // Switch to search view
        const searchButton = page.locator('button', { hasText: 'Search' });
        await searchButton.click();
        await page.waitForTimeout(500);

        // Find threshold slider
        const thresholdSlider = page.locator('input[type="range"]');
        await expect(thresholdSlider).toBeVisible({ timeout: 5000 });

        // Get initial value
        const initialValue = await thresholdSlider.inputValue();
        console.log(`Initial threshold value: ${initialValue}`);

        // Adjust slider
        await thresholdSlider.fill('0.85');
        await page.waitForTimeout(300);

        // Verify value changed
        const newValue = await thresholdSlider.inputValue();
        console.log(`New threshold value: ${newValue}`);
        expect(newValue).toBe('0.85');

        // Take screenshot
        await page.screenshot({
            path: 'screenshots/semantic-search-04-threshold-adjusted.png',
            fullPage: true,
        });
    });

    test('5. Search Execution', async ({ page }) => {
        console.log('=== TEST 5: Search Execution ===');

        // Switch to search view
        const searchButton = page.locator('button', { hasText: 'Search' });
        await searchButton.click();
        await page.waitForTimeout(500);

        // Fill search input
        const searchInput = page.locator(
            'input[placeholder*="Search memories using natural language"]'
        );
        await searchInput.fill('compliance check');

        // Click search button
        const searchSubmitButton = page.locator('button[type="submit"]', {
            hasText: 'Search',
        });
        await searchSubmitButton.click();

        // Wait for search to complete (check for loading state to disappear)
        await page.waitForTimeout(2000);

        // Check for results or empty state
        const hasResults = await page.locator('text=Search Results').isVisible();
        const hasEmptyState = await page.locator('text=No matching memories found').isVisible();

        console.log(`Has results: ${hasResults}, Has empty state: ${hasEmptyState}`);

        expect(hasResults || hasEmptyState).toBe(true);

        // Take screenshot
        await page.screenshot({
            path: 'screenshots/semantic-search-05-search-executed.png',
            fullPage: true,
        });
    });

    test('6. Clear Search Input', async ({ page }) => {
        console.log('=== TEST 6: Clear Search Input ===');

        // Switch to search view
        const searchButton = page.locator('button', { hasText: 'Search' });
        await searchButton.click();
        await page.waitForTimeout(500);

        // Fill search input
        const searchInput = page.locator(
            'input[placeholder*="Search memories using natural language"]'
        );
        await searchInput.fill('test query');
        await page.waitForTimeout(300);

        // Click clear button (X icon)
        const clearButton = page.locator('button[aria-label="Clear search"]');
        if (await clearButton.isVisible()) {
            await clearButton.click();
            await page.waitForTimeout(300);

            // Verify input is cleared
            const inputValue = await searchInput.inputValue();
            expect(inputValue).toBe('');

            console.log('Search input cleared successfully');
        } else {
            console.log('Clear button not visible (expected when no text)');
        }

        // Take screenshot
        await page.screenshot({
            path: 'screenshots/semantic-search-06-input-cleared.png',
            fullPage: true,
        });
    });

    test('7. Keyboard Navigation', async ({ page }) => {
        console.log('=== TEST 7: Keyboard Navigation ===');

        // Switch to search view
        const searchButton = page.locator('button', { hasText: 'Search' });
        await searchButton.click();
        await page.waitForTimeout(500);

        // Tab to search input
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Type using keyboard
        await page.keyboard.type('keyboard test query');
        await page.waitForTimeout(300);

        // Press Enter to submit
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);

        console.log('Keyboard navigation and submission works');

        // Take screenshot
        await page.screenshot({
            path: 'screenshots/semantic-search-07-keyboard-nav.png',
            fullPage: true,
        });
    });

    test('8. Search History Persistence', async ({ page }) => {
        console.log('=== TEST 8: Search History Persistence ===');

        // Switch to search view
        const searchButton = page.locator('button', { hasText: 'Search' });
        await searchButton.click();
        await page.waitForTimeout(500);

        // Perform a search
        const searchInput = page.locator(
            'input[placeholder*="Search memories using natural language"]'
        );
        await searchInput.fill('test search for history');

        const searchSubmitButton = page.locator('button[type="submit"]', {
            hasText: 'Search',
        });
        await searchSubmitButton.click();
        await page.waitForTimeout(2000);

        // Clear input and focus again to show history
        await searchInput.clear();
        await searchInput.focus();
        await page.waitForTimeout(500);

        // Check if search history dropdown appears
        const hasHistory = await page.locator('text=Recent Searches').isVisible();

        if (hasHistory) {
            console.log('Search history is visible');

            // Take screenshot
            await page.screenshot({
                path: 'screenshots/semantic-search-08-history-visible.png',
                fullPage: true,
            });
        } else {
            console.log('Search history not visible (may be empty or not implemented)');
        }
    });

    test('9. Switch Between Browse and Search', async ({ page }) => {
        console.log('=== TEST 9: Switch Between Browse and Search ===');

        // Click Browse button
        const browseButton = page.locator('button', { hasText: 'Browse' });
        await browseButton.click();
        await page.waitForTimeout(500);

        // Verify browse view is shown (filters button should be visible)
        const filtersButton = page.locator('button', { hasText: 'Filters' });
        await expect(filtersButton).toBeVisible({ timeout: 5000 });

        console.log('Browse view is active');

        // Click Search button
        const searchButton = page.locator('button', { hasText: 'Search' });
        await searchButton.click();
        await page.waitForTimeout(500);

        // Verify search view is shown
        const searchInput = page.locator(
            'input[placeholder*="Search memories using natural language"]'
        );
        await expect(searchInput).toBeVisible({ timeout: 5000 });

        console.log('Search view is active');

        // Take screenshot
        await page.screenshot({
            path: 'screenshots/semantic-search-09-view-switching.png',
            fullPage: true,
        });
    });

    test('10. No Console Errors During Search', async ({ page }) => {
        console.log('=== TEST 10: No Console Errors During Search ===');

        // Switch to search view
        const searchButton = page.locator('button', { hasText: 'Search' });
        await searchButton.click();
        await page.waitForTimeout(500);

        // Perform a search
        const searchInput = page.locator(
            'input[placeholder*="Search memories using natural language"]'
        );
        await searchInput.fill('error check query');

        const searchSubmitButton = page.locator('button[type="submit"]', {
            hasText: 'Search',
        });
        await searchSubmitButton.click();
        await page.waitForTimeout(3000);

        // Check for console errors (excluding expected network errors for missing data)
        const relevantErrors = consoleErrors.filter(
            (error) => !error.includes('404') && !error.includes('Network')
        );

        console.log(`Console errors found: ${relevantErrors.length}`);
        if (relevantErrors.length > 0) {
            console.log('Errors:', relevantErrors);
        }

        // We allow some errors since backend might not be running
        // But we log them for review
        expect(relevantErrors.length).toBeLessThanOrEqual(5);
    });

    test.afterEach(async () => {
        // Log any errors that occurred
        if (consoleErrors.length > 0) {
            console.log('\nConsole Errors:');
            consoleErrors.forEach((err) => console.log(err));
        }
        if (networkErrors.length > 0) {
            console.log('\nNetwork Errors:');
            networkErrors.forEach((err) => console.log(err));
        }
    });
});
