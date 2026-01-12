import { test, expect, Page } from '@playwright/test';

// Test configuration
const FRONTEND_URL = 'http://localhost:5173';
const TEST_API_KEY = 'demo_key_user1_abc123';

// Increase timeout for workflow replay tests
test.setTimeout(90000);

// Helper to collect console errors
let consoleErrors: string[] = [];
let networkErrors: string[] = [];

/**
 * E2E tests for Run Replay functionality (Issue #34)
 * Tests step-by-step navigation, play/pause controls, timeline scrubber,
 * state visualization, and playback speed control.
 */
test.describe('Run Replay E2E Tests', () => {
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

        // Check if already logged in
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

            // Wait for redirect to dashboard
            await page.waitForURL(/\/$/, { timeout: 10000 });
        }

        // Ensure we're on the Overview page
        await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('h1:has-text("Auditable Fintech Agent Workflow")', { timeout: 10000 });
    });

    test.afterEach(async () => {
        // Report any errors found during the test
        if (consoleErrors.length > 0) {
            console.log('Console Errors:', consoleErrors);
        }
        if (networkErrors.length > 0) {
            console.log('Network Errors:', networkErrors);
        }
    });

    test('should display Run Replay component on Run Detail page', async ({ page }) => {
        // Navigate to Runs page
        await page.click('a:has-text("Runs")');
        await page.waitForURL(/\/runs/, { timeout: 10000 });

        // Wait for runs list to load
        await page.waitForSelector('div.space-y-3', { timeout: 15000 });

        // Find and click the first run
        const firstRunLink = page.locator('a[href^="/runs/run_"]').first();
        const firstRunExists = await firstRunLink.count() > 0;

        if (!firstRunExists) {
            console.log('No runs found - skipping test');
            test.skip();
            return;
        }

        await firstRunLink.click();
        await page.waitForURL(/\/runs\/run_/, { timeout: 10000 });

        // Wait for Run Detail page to load
        await page.waitForSelector('h1', { timeout: 10000 });

        // Check for Workflow Replay section
        const replaySection = page.locator('h2:has-text("Workflow Replay")');
        await expect(replaySection).toBeVisible({ timeout: 10000 });

        // Verify Run Replay component is present
        const playButton = page.locator('button[aria-label="Play"]');
        await expect(playButton).toBeVisible({ timeout: 5000 });
    });

    test('should have all replay controls visible', async ({ page }) => {
        // Navigate to a run detail page
        await navigateToRunDetail(page);

        // Verify all control buttons are visible
        await expect(page.locator('button[aria-label="Play"]')).toBeVisible();
        await expect(page.locator('button[aria-label="Previous step"]')).toBeVisible();
        await expect(page.locator('button[aria-label="Next step"]')).toBeVisible();
        await expect(page.locator('button[aria-label="Reset to beginning"]')).toBeVisible();

        // Verify step counter is visible
        await expect(page.locator('text=/Step \\d+ \\/ \\d+/')).toBeVisible();

        // Verify timeline scrubber is visible
        await expect(page.locator('div[role="slider"][aria-label="Timeline scrubber"]')).toBeVisible();

        // Verify playback speed controls are visible
        await expect(page.locator('button:has-text("0.25x")')).toBeVisible();
        await expect(page.locator('button:has-text("0.5x")')).toBeVisible();
        await expect(page.locator('button:has-text("1x")')).toBeVisible();
        await expect(page.locator('button:has-text("2x")')).toBeVisible();
        await expect(page.locator('button:has-text("4x")')).toBeVisible();
    });

    test('should navigate forward and backward through steps', async ({ page }) => {
        await navigateToRunDetail(page);

        // Get initial step counter
        const initialStep = await page.locator('text=/Step \\d+ \\/ \\d+/').textContent();
        const initialStepNum = parseInt(initialStep?.match(/Step (\d+)/)?.[1] || '1');

        // Click next step button
        await page.click('button[aria-label="Next step"]');
        await page.waitForTimeout(500); // Wait for state update

        // Verify step increased
        const afterNextStep = await page.locator('text=/Step \\d+ \\/ \\d+/').textContent();
        const afterNextStepNum = parseInt(afterNextStep?.match(/Step (\d+)/)?.[1] || '1');
        expect(afterNextStepNum).toBeGreaterThan(initialStepNum);

        // Click previous step button
        await page.click('button[aria-label="Previous step"]');
        await page.waitForTimeout(500);

        // Verify step decreased
        const afterPrevStep = await page.locator('text=/Step \\d+ \\/ \\d+/').textContent();
        const afterPrevStepNum = parseInt(afterPrevStep?.match(/Step (\d+)/)?.[1] || '1');
        expect(afterPrevStepNum).toBe(initialStepNum);
    });

    test('should play and pause workflow replay', async ({ page }) => {
        await navigateToRunDetail(page);

        // Get initial step
        const initialStep = await page.locator('text=/Step \\d+ \\/ \\d+/').textContent();

        // Click play button
        const playButton = page.locator('button[aria-label="Play"]');
        await playButton.click();

        // Verify pause button is now visible
        await expect(page.locator('button[aria-label="Pause"]')).toBeVisible({ timeout: 1000 });

        // Wait for auto-advance (1 second default speed)
        await page.waitForTimeout(1500);

        // Get current step - should have advanced
        const afterPlayStep = await page.locator('text=/Step \\d+ \\/ \\d+/').textContent();

        // Steps should be different if there are multiple steps
        if (afterPlayStep !== initialStep) {
            // Click pause
            await page.click('button[aria-label="Pause"]');

            // Verify play button is visible again
            await expect(page.locator('button[aria-label="Play"]')).toBeVisible({ timeout: 1000 });
        }
    });

    test('should reset to beginning when reset button clicked', async ({ page }) => {
        await navigateToRunDetail(page);

        // Navigate to step 3 or higher
        await page.click('button[aria-label="Next step"]');
        await page.waitForTimeout(300);
        await page.click('button[aria-label="Next step"]');
        await page.waitForTimeout(300);
        await page.click('button[aria-label="Next step"]');
        await page.waitForTimeout(300);

        // Click reset button
        await page.click('button[aria-label="Reset to beginning"]');
        await page.waitForTimeout(500);

        // Verify we're at step 1
        const stepText = await page.locator('text=/Step \\d+ \\/ \\d+/').textContent();
        expect(stepText).toContain('Step 1');
    });

    test('should change playback speed', async ({ page }) => {
        await navigateToRunDetail(page);

        // Click on 2x speed button
        const speed2xButton = page.locator('button:has-text("2x")');
        await speed2xButton.click();

        // Verify 2x button is highlighted (has primary background)
        await expect(speed2xButton).toHaveClass(/bg-\[var\(--primary\)\]/);

        // Click on 0.5x speed button
        const speed05xButton = page.locator('button:has-text("0.5x")');
        await speed05xButton.click();

        // Verify 0.5x button is highlighted
        await expect(speed05xButton).toHaveClass(/bg-\[var\(--primary\)\]/);

        // Verify 2x button is no longer highlighted
        await expect(speed2xButton).not.toHaveClass(/bg-\[var\(--primary\)\]/);
    });

    test('should display current step details', async ({ page }) => {
        await navigateToRunDetail(page);

        // Verify current step section exists
        const stepDetailsSection = page.locator('h3').filter({ hasText: /^[A-Z]/ }).first();
        await expect(stepDetailsSection).toBeVisible({ timeout: 5000 });

        // Verify step type badge is visible
        await expect(page.locator('span:has-text("MEMORY"), span:has-text("COMPLIANCE"), span:has-text("X402"), span:has-text("TOOL_CALL")').first()).toBeVisible();

        // Verify "View Step Data" details section exists
        await expect(page.locator('summary:has-text("View Step Data")')).toBeVisible();
    });

    test('should display agent state statistics at current step', async ({ page }) => {
        await navigateToRunDetail(page);

        // Verify "Agent State at Step" section exists
        await expect(page.locator('h3:has-text("Agent State at Step")')).toBeVisible();

        // Verify all four stat cards are present
        await expect(page.locator('div:has-text("Memory Entries")')).toBeVisible();
        await expect(page.locator('div:has-text("Compliance Events")')).toBeVisible();
        await expect(page.locator('div:has-text("X402 Requests")')).toBeVisible();
        await expect(page.locator('div:has-text("Tool Calls")')).toBeVisible();

        // Verify stat numbers are displayed
        const statCards = page.locator('div.bg-\\[var\\(--surface-2\\)\\].rounded-xl');
        const count = await statCards.count();
        expect(count).toBeGreaterThanOrEqual(4);
    });

    test('should jump to specific step from step list', async ({ page }) => {
        await navigateToRunDetail(page);

        // Find "Jump to Step" section
        await expect(page.locator('h3:has-text("Jump to Step")')).toBeVisible();

        // Get total number of steps
        const stepText = await page.locator('text=/Step \\d+ \\/ \\d+/').textContent();
        const totalSteps = parseInt(stepText?.match(/\/ (\d+)/)?.[1] || '0');

        if (totalSteps > 3) {
            // Click on step 3 in the list (index 2, 0-based)
            const step3Button = page.locator('button').filter({ hasText: /^3/ }).first();
            await step3Button.click();
            await page.waitForTimeout(500);

            // Verify we're at step 3
            const currentStep = await page.locator('text=/Step \\d+ \\/ \\d+/').textContent();
            expect(currentStep).toContain('Step 3');

            // Verify step 3 button is highlighted
            await expect(step3Button).toHaveClass(/bg-\[var\(--primary\)\]/);
        }
    });

    test('should interact with timeline scrubber', async ({ page }) => {
        await navigateToRunDetail(page);

        // Get the timeline scrubber element
        const scrubber = page.locator('div[role="slider"][aria-label="Timeline scrubber"]');
        await expect(scrubber).toBeVisible();

        // Get bounding box for the scrubber
        const scrubberBox = await scrubber.boundingBox();

        if (scrubberBox) {
            // Click at 50% position on the timeline
            await page.mouse.click(
                scrubberBox.x + (scrubberBox.width * 0.5),
                scrubberBox.y + (scrubberBox.height * 0.5)
            );

            await page.waitForTimeout(500);

            // Verify step changed (should be around middle of timeline)
            const stepText = await page.locator('text=/Step \\d+ \\/ \\d+/').textContent();
            const [currentStepStr, totalStepsStr] = stepText?.match(/\d+/g) || ['1', '1'];
            const currentStep = parseInt(currentStepStr);
            const totalSteps = parseInt(totalStepsStr);

            // Current step should be roughly in the middle (within 20% tolerance)
            const expectedMidpoint = totalSteps / 2;
            const tolerance = totalSteps * 0.3;
            expect(currentStep).toBeGreaterThan(expectedMidpoint - tolerance);
            expect(currentStep).toBeLessThan(expectedMidpoint + tolerance);
        }
    });

    test('should update state statistics when navigating steps', async ({ page }) => {
        await navigateToRunDetail(page);

        // Get initial memory count at step 1
        const initialMemoryText = await page.locator('div:has-text("Memory Entries")').locator('div.text-2xl').textContent();
        const initialMemoryCount = parseInt(initialMemoryText || '0');

        // Navigate forward several steps
        for (let i = 0; i < 3; i++) {
            await page.click('button[aria-label="Next step"]');
            await page.waitForTimeout(300);
        }

        // Get memory count after advancing
        const afterMemoryText = await page.locator('div:has-text("Memory Entries")').locator('div.text-2xl').textContent();
        const afterMemoryCount = parseInt(afterMemoryText || '0');

        // Count should be same or increased (never decreased when going forward)
        expect(afterMemoryCount).toBeGreaterThanOrEqual(initialMemoryCount);
    });

    test('should expand and show step data details', async ({ page }) => {
        await navigateToRunDetail(page);

        // Find "View Step Data" summary
        const stepDataSummary = page.locator('summary:has-text("View Step Data")');
        await expect(stepDataSummary).toBeVisible();

        // Click to expand
        await stepDataSummary.click();
        await page.waitForTimeout(300);

        // Verify JSON data is displayed
        const jsonPre = page.locator('pre').filter({ has: page.locator('text=/[{\\[]|memory_id|event_id|request_id/') });
        await expect(jsonPre).toBeVisible({ timeout: 2000 });

        // Verify it contains valid JSON structure
        const jsonText = await jsonPre.textContent();
        expect(jsonText).toBeTruthy();
        expect(jsonText?.length).toBeGreaterThan(10);
    });

    test('should have accessible controls with proper ARIA labels', async ({ page }) => {
        await navigateToRunDetail(page);

        // Verify ARIA labels are present for accessibility
        await expect(page.locator('button[aria-label="Play"]')).toBeVisible();
        await expect(page.locator('button[aria-label="Previous step"]')).toBeVisible();
        await expect(page.locator('button[aria-label="Next step"]')).toBeVisible();
        await expect(page.locator('button[aria-label="Reset to beginning"]')).toBeVisible();
        await expect(page.locator('div[role="slider"][aria-label="Timeline scrubber"]')).toBeVisible();

        // Verify slider has proper ARIA attributes
        const slider = page.locator('div[role="slider"][aria-label="Timeline scrubber"]');
        const ariaValueMin = await slider.getAttribute('aria-valuemin');
        const ariaValueMax = await slider.getAttribute('aria-valuemax');
        const ariaValueNow = await slider.getAttribute('aria-valuenow');

        expect(ariaValueMin).toBe('0');
        expect(ariaValueMax).toBeTruthy();
        expect(ariaValueNow).toBeTruthy();
    });

    test('should disable previous button at first step', async ({ page }) => {
        await navigateToRunDetail(page);

        // Reset to beginning
        await page.click('button[aria-label="Reset to beginning"]');
        await page.waitForTimeout(500);

        // Verify previous button is disabled
        const prevButton = page.locator('button[aria-label="Previous step"]');
        await expect(prevButton).toBeDisabled();
    });

    test('should disable next button at last step', async ({ page }) => {
        await navigateToRunDetail(page);

        // Get total steps
        const stepText = await page.locator('text=/Step \\d+ \\/ \\d+/').textContent();
        const totalSteps = parseInt(stepText?.match(/\/ (\d+)/)?.[1] || '0');

        // Jump to last step
        const lastStepButton = page.locator('button').filter({ hasText: new RegExp(`^${totalSteps}`) }).first();
        await lastStepButton.click();
        await page.waitForTimeout(500);

        // Verify next button is disabled
        const nextButton = page.locator('button[aria-label="Next step"]');
        await expect(nextButton).toBeDisabled();
    });
});

/**
 * Helper function to navigate to a run detail page
 */
async function navigateToRunDetail(page: Page) {
    // Navigate to Runs page
    await page.click('a:has-text("Runs")');
    await page.waitForURL(/\/runs/, { timeout: 10000 });

    // Wait for runs list
    await page.waitForSelector('div.space-y-3', { timeout: 15000 });

    // Click first run
    const firstRunLink = page.locator('a[href^="/runs/run_"]').first();
    const firstRunExists = await firstRunLink.count() > 0;

    if (!firstRunExists) {
        test.skip();
        return;
    }

    await firstRunLink.click();
    await page.waitForURL(/\/runs\/run_/, { timeout: 10000 });

    // Wait for page load
    await page.waitForSelector('h2:has-text("Workflow Replay")', { timeout: 15000 });
}
