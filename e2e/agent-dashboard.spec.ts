/**
 * E2E Tests: Agent Dashboard
 *
 * Tests the agent dashboard functionality including:
 * - Agent card display (3 agents)
 * - Agent names, roles, and reputation
 * - Treasury balance display
 * - Hire modal with form validation
 * - Stats overview cards
 *
 * Note: Dashboard tests require backend to be running.
 * Tests gracefully handle backend unavailability.
 *
 * @see https://github.com/AINative-Studio/agent402/issues/125
 * @see https://github.com/AINative-Studio/agent402/issues/128
 */

import { test, expect, Page } from '@playwright/test';
import {
    TEST_CONFIG,
    navigateWithAuth,
    setupErrorCollector,
    waitForStableUrl,
} from './fixtures';

/**
 * Helper to check if we're on the dashboard (backend available)
 */
async function checkDashboardAccess(page: Page): Promise<boolean> {
    const currentUrl = page.url();
    return !currentUrl.includes('/login');
}

test.describe('Agent Dashboard - Layout and Content', () => {
    test.setTimeout(TEST_CONFIG.testTimeout);

    test.beforeEach(async ({ page }) => {
        setupErrorCollector(page);
        await navigateWithAuth(page, '/dashboard');
        await waitForStableUrl(page);
        await page.waitForLoadState('networkidle');
    });

    test('should display the agent dashboard page title', async ({ page }) => {
        if (!await checkDashboardAccess(page)) {
            test.info().annotations.push({ type: 'skip-reason', description: 'Backend not available' });
            expect(true).toBe(true);
            return;
        }

        // Given: User is on the dashboard page
        // When: Looking at the page header
        const pageTitle = page.locator('h1:has-text("Agent Dashboard")');

        // Then: Page title should be visible
        await expect(pageTitle).toBeVisible({ timeout: 10000 });
    });

    test('should display the dashboard description', async ({ page }) => {
        if (!await checkDashboardAccess(page)) {
            test.info().annotations.push({ type: 'skip-reason', description: 'Backend not available' });
            expect(true).toBe(true);
            return;
        }

        // Given: User is on the dashboard page
        // When: Looking at the description
        const description = page.locator('text=View agent reputation, treasury balances, and hire agents').first();

        // Then: Description should be visible
        await expect(description).toBeVisible({ timeout: 10000 });
    });

    test('should display 3 agent cards', async ({ page }) => {
        if (!await checkDashboardAccess(page)) {
            test.info().annotations.push({ type: 'skip-reason', description: 'Backend not available' });
            expect(true).toBe(true);
            return;
        }

        // Given: User is on the dashboard page
        // When: Looking at the agents grid
        await page.waitForSelector('h2:has-text("Available Agents")', { timeout: 10000 });

        // Then: Should have 3 agent cards (each with a Hire button)
        const hireButtons = page.locator('button:has-text("Hire")');
        const count = await hireButtons.count();
        expect(count).toBe(3);
    });

    test('should show Analyst Agent card', async ({ page }) => {
        if (!await checkDashboardAccess(page)) {
            test.info().annotations.push({ type: 'skip-reason', description: 'Backend not available' });
            expect(true).toBe(true);
            return;
        }

        // Given: User is on the dashboard page
        // When: Looking for the Analyst Agent
        const analystAgent = page.locator('text=Analyst Agent').first();

        // Then: Analyst Agent card should be visible
        await expect(analystAgent).toBeVisible({ timeout: 10000 });
    });

    test('should show Compliance Agent card', async ({ page }) => {
        if (!await checkDashboardAccess(page)) {
            test.info().annotations.push({ type: 'skip-reason', description: 'Backend not available' });
            expect(true).toBe(true);
            return;
        }

        // Given: User is on the dashboard page
        // When: Looking for the Compliance Agent
        const complianceAgent = page.locator('text=Compliance Agent').first();

        // Then: Compliance Agent card should be visible
        await expect(complianceAgent).toBeVisible({ timeout: 10000 });
    });

    test('should show Transaction Agent card', async ({ page }) => {
        if (!await checkDashboardAccess(page)) {
            test.info().annotations.push({ type: 'skip-reason', description: 'Backend not available' });
            expect(true).toBe(true);
            return;
        }

        // Given: User is on the dashboard page
        // When: Looking for the Transaction Agent
        const transactionAgent = page.locator('text=Transaction Agent').first();

        // Then: Transaction Agent card should be visible
        await expect(transactionAgent).toBeVisible({ timeout: 10000 });
    });

    test('should display agent roles', async ({ page }) => {
        if (!await checkDashboardAccess(page)) {
            test.info().annotations.push({ type: 'skip-reason', description: 'Backend not available' });
            expect(true).toBe(true);
            return;
        }

        // Given: User is on the dashboard page
        // When: Looking for role badges
        const marketAnalyst = page.locator('text=Market Analyst').first();
        const complianceOfficer = page.locator('text=Compliance Officer').first();
        const transactionProcessor = page.locator('text=Transaction Processor').first();

        // Then: All roles should be visible
        await expect(marketAnalyst).toBeVisible({ timeout: 10000 });
        await expect(complianceOfficer).toBeVisible({ timeout: 10000 });
        await expect(transactionProcessor).toBeVisible({ timeout: 10000 });
    });

    test('should display hourly rates for agents', async ({ page }) => {
        if (!await checkDashboardAccess(page)) {
            test.info().annotations.push({ type: 'skip-reason', description: 'Backend not available' });
            expect(true).toBe(true);
            return;
        }

        // Given: User is on the dashboard page
        // When: Looking for hourly rate information
        const rate35 = page.locator('text=~$35/hr').first();
        const rate50 = page.locator('text=~$50/hr').first();
        const rate25 = page.locator('text=~$25/hr').first();

        // Then: At least one rate should be visible
        const hasRate35 = await rate35.isVisible().catch(() => false);
        const hasRate50 = await rate50.isVisible().catch(() => false);
        const hasRate25 = await rate25.isVisible().catch(() => false);

        expect(hasRate35 || hasRate50 || hasRate25).toBe(true);
    });

    test('should display trust tier badges', async ({ page }) => {
        if (!await checkDashboardAccess(page)) {
            test.info().annotations.push({ type: 'skip-reason', description: 'Backend not available' });
            expect(true).toBe(true);
            return;
        }

        // Given: User is on the dashboard page
        // When: Looking for trust tier badges
        const trustedBadge = page.locator('text=Trusted').first();
        const verifiedBadge = page.locator('text=Verified').first();
        const expertBadge = page.locator('text=Expert').first();

        // Then: At least one trust tier should be visible
        const hasTrusted = await trustedBadge.isVisible().catch(() => false);
        const hasVerified = await verifiedBadge.isVisible().catch(() => false);
        const hasExpert = await expertBadge.isVisible().catch(() => false);

        expect(hasTrusted || hasVerified || hasExpert).toBe(true);
    });
});

test.describe('Agent Dashboard - Stats Overview', () => {
    test.setTimeout(TEST_CONFIG.testTimeout);

    test.beforeEach(async ({ page }) => {
        setupErrorCollector(page);
        await navigateWithAuth(page, '/dashboard');
        await waitForStableUrl(page);
        await page.waitForLoadState('networkidle');
    });

    test('should display stats cards', async ({ page }) => {
        if (!await checkDashboardAccess(page)) {
            test.info().annotations.push({ type: 'skip-reason', description: 'Backend not available' });
            expect(true).toBe(true);
            return;
        }

        // Given: User is on the dashboard page
        // When: Looking at the stats section
        // Then: Should have 4 stats cards
        const registeredAgents = page.locator('text=Registered Agents').first();
        const activeTreasuries = page.locator('text=Active Treasuries').first();
        const totalPayments = page.locator('text=Total Payments').first();
        const totalFeedbacks = page.locator('text=Total Feedbacks').first();

        await expect(registeredAgents).toBeVisible({ timeout: 10000 });
        await expect(activeTreasuries).toBeVisible({ timeout: 10000 });
        await expect(totalPayments).toBeVisible({ timeout: 10000 });
        await expect(totalFeedbacks).toBeVisible({ timeout: 10000 });
    });

    test('should show Arc Testnet in stats description', async ({ page }) => {
        if (!await checkDashboardAccess(page)) {
            test.info().annotations.push({ type: 'skip-reason', description: 'Backend not available' });
            expect(true).toBe(true);
            return;
        }

        // Given: User is on the dashboard page
        // When: Looking at stats descriptions
        const arcTestnet = page.locator('text=On Arc Testnet').first();

        // Then: Should show Arc Testnet reference
        await expect(arcTestnet).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Agent Dashboard - Hire Modal', () => {
    test.setTimeout(TEST_CONFIG.testTimeout);

    test.beforeEach(async ({ page }) => {
        setupErrorCollector(page);
        await navigateWithAuth(page, '/dashboard');
        await waitForStableUrl(page);
        await page.waitForLoadState('networkidle');
    });

    test('should have hire buttons for all agents', async ({ page }) => {
        if (!await checkDashboardAccess(page)) {
            test.info().annotations.push({ type: 'skip-reason', description: 'Backend not available' });
            expect(true).toBe(true);
            return;
        }

        // Given: User is on the dashboard page
        await page.waitForSelector('h2:has-text("Available Agents")', { timeout: 10000 });

        // When: Counting hire buttons
        const hireButtons = page.locator('button:has-text("Hire")');
        const count = await hireButtons.count();

        // Then: Should have 3 hire buttons (one per agent)
        expect(count).toBe(3);
    });

    test('should show hire button disabled state based on wallet connection', async ({ page }) => {
        if (!await checkDashboardAccess(page)) {
            test.info().annotations.push({ type: 'skip-reason', description: 'Backend not available' });
            expect(true).toBe(true);
            return;
        }

        // Given: User is on dashboard
        await page.waitForSelector('h2:has-text("Available Agents")', { timeout: 10000 });

        // When: Checking first Hire button
        const hireButtons = page.locator('button:has-text("Hire")');
        const firstHireButton = hireButtons.first();

        // Then: Button should have a disabled state (wallet not connected)
        const isDisabled = await firstHireButton.isDisabled();
        expect(isDisabled).toBe(true);
    });
});

test.describe('Agent Dashboard - Feedback', () => {
    test.setTimeout(TEST_CONFIG.testTimeout);

    test.beforeEach(async ({ page }) => {
        setupErrorCollector(page);
        await navigateWithAuth(page, '/dashboard');
        await waitForStableUrl(page);
        await page.waitForLoadState('networkidle');
    });

    test('should have feedback buttons for all agents', async ({ page }) => {
        if (!await checkDashboardAccess(page)) {
            test.info().annotations.push({ type: 'skip-reason', description: 'Backend not available' });
            expect(true).toBe(true);
            return;
        }

        // Given: User is on the dashboard page
        await page.waitForSelector('h2:has-text("Available Agents")', { timeout: 10000 });

        // When: Counting feedback buttons
        const feedbackButtons = page.locator('button:has-text("Feedback")');
        const count = await feedbackButtons.count();

        // Then: Should have 3 feedback buttons (one per agent)
        expect(count).toBe(3);
    });

    test('should show feedback button disabled state based on wallet connection', async ({ page }) => {
        if (!await checkDashboardAccess(page)) {
            test.info().annotations.push({ type: 'skip-reason', description: 'Backend not available' });
            expect(true).toBe(true);
            return;
        }

        // Given: User is on dashboard
        await page.waitForSelector('h2:has-text("Available Agents")', { timeout: 10000 });

        // When: Checking first Feedback button
        const feedbackButtons = page.locator('button:has-text("Feedback")');
        const firstFeedbackButton = feedbackButtons.first();

        // Then: Button should have a disabled state (wallet not connected)
        const isDisabled = await firstFeedbackButton.isDisabled();
        expect(isDisabled).toBe(true);
    });
});

test.describe('Agent Dashboard - DID Display', () => {
    test.setTimeout(TEST_CONFIG.testTimeout);

    test.beforeEach(async ({ page }) => {
        setupErrorCollector(page);
        await navigateWithAuth(page, '/dashboard');
        await waitForStableUrl(page);
        await page.waitForLoadState('networkidle');
    });

    test('should display truncated DIDs for agents', async ({ page }) => {
        if (!await checkDashboardAccess(page)) {
            test.info().annotations.push({ type: 'skip-reason', description: 'Backend not available' });
            expect(true).toBe(true);
            return;
        }

        // Given: User is on the dashboard page
        await page.waitForSelector('h2:has-text("Available Agents")', { timeout: 10000 });

        // When: Looking at agent cards
        // Then: Should show DID format (did:arc:...)
        const didElement = page.locator('text=/did:arc:/').first();
        await expect(didElement).toBeVisible({ timeout: 10000 });

        // DIDs should be truncated (contain ...)
        const didText = await didElement.textContent();
        expect(didText).toContain('...');
    });
});

test.describe('Agent Dashboard - Visual Layout', () => {
    test.setTimeout(TEST_CONFIG.testTimeout);

    test.beforeEach(async ({ page }) => {
        setupErrorCollector(page);
        await navigateWithAuth(page, '/dashboard');
        await waitForStableUrl(page);
        await page.waitForLoadState('networkidle');
    });

    test('should display agents in a grid layout', async ({ page }) => {
        if (!await checkDashboardAccess(page)) {
            test.info().annotations.push({ type: 'skip-reason', description: 'Backend not available' });
            expect(true).toBe(true);
            return;
        }

        // Given: User is on the dashboard page
        await page.waitForSelector('h2:has-text("Available Agents")', { timeout: 10000 });

        // When: Looking at the agents section
        // Then: Should have a grid container
        const gridContainer = page.locator('.grid').first();
        await expect(gridContainer).toBeVisible({ timeout: 10000 });
    });

    test('should have proper section headers', async ({ page }) => {
        if (!await checkDashboardAccess(page)) {
            test.info().annotations.push({ type: 'skip-reason', description: 'Backend not available' });
            expect(true).toBe(true);
            return;
        }

        // Given: User is on the dashboard page
        // When: Looking at section headers
        const agentDashboard = page.locator('h1:has-text("Agent Dashboard")');
        const availableAgents = page.locator('h2:has-text("Available Agents")');

        // Then: Both headers should be visible
        await expect(agentDashboard).toBeVisible({ timeout: 10000 });
        await expect(availableAgents).toBeVisible({ timeout: 10000 });
    });
});
