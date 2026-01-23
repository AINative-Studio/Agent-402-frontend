/**
 * E2E Test Fixtures and Helpers
 *
 * Provides mock data and utility functions for Agent-402 E2E tests.
 * Enables deterministic testing of wallet-dependent features.
 */

import { Page } from '@playwright/test';

// Test configuration
export const TEST_CONFIG = {
    frontendUrl: 'http://localhost:5173',
    backendUrl: 'http://localhost:8000',
    apiKey: 'demo_key_user1_abc123',
    defaultTimeout: 30000,
    testTimeout: 120000,
};

/**
 * Check if backend is available
 */
export async function isBackendAvailable(): Promise<boolean> {
    try {
        const response = await fetch(`${TEST_CONFIG.backendUrl}/health`);
        return response.ok;
    } catch {
        return false;
    }
}

// Mock connected wallet state
export const mockConnectedWallet = {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    displayAddress: '0x1234...5678',
    chainId: 5042002, // Arc Testnet
    chainName: 'Arc Testnet',
    usdcBalance: '1000.00 USDC',
};

// Mock agent data (matches Dashboard DEMO_AGENTS)
export const mockAgents = [
    {
        tokenId: 1,
        name: 'Analyst Agent',
        role: 'Market Analyst',
        did: 'did:arc:0x1234567890abcdef1234567890abcdef12345678',
        description: 'Specialized in market analysis, trend identification, and financial data processing.',
        trustTier: 3,
        hourlyRate: 35,
    },
    {
        tokenId: 2,
        name: 'Compliance Agent',
        role: 'Compliance Officer',
        did: 'did:arc:0xabcdef1234567890abcdef1234567890abcdef12',
        description: 'Ensures regulatory compliance, risk assessment, and audit trail generation.',
        trustTier: 4,
        hourlyRate: 50,
    },
    {
        tokenId: 3,
        name: 'Transaction Agent',
        role: 'Transaction Processor',
        did: 'did:arc:0x7890abcdef1234567890abcdef1234567890abcd',
        description: 'Handles secure transaction execution, payment processing, and settlement.',
        trustTier: 2,
        hourlyRate: 25,
    },
];

/**
 * Set up authentication by injecting API key into localStorage
 */
export async function setupAuth(page: Page): Promise<void> {
    await page.addInitScript((apiKey) => {
        window.localStorage.setItem('apiKey', apiKey);
    }, TEST_CONFIG.apiKey);
}

/**
 * Clear authentication state
 */
export async function clearAuth(page: Page): Promise<void> {
    await page.addInitScript(() => {
        window.localStorage.clear();
    });
}

/**
 * Wait for page URL to stabilize (no more redirects)
 */
export async function waitForStableUrl(
    page: Page,
    maxAttempts = 10,
    intervalMs = 500
): Promise<string> {
    let lastUrl = '';
    let stableCount = 0;

    for (let i = 0; i < maxAttempts; i++) {
        await page.waitForTimeout(intervalMs);
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

/**
 * Navigate with authentication
 */
export async function navigateWithAuth(
    page: Page,
    path: string,
    options: { waitForLoad?: boolean } = {}
): Promise<void> {
    await setupAuth(page);
    const url = `${TEST_CONFIG.frontendUrl}${path}`;
    await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: TEST_CONFIG.defaultTimeout,
    });

    if (options.waitForLoad !== false) {
        await page.waitForSelector('#root', { timeout: 10000 });
        await page.waitForTimeout(1000);
    }
}

/**
 * Mock wallet connection state by injecting into window
 * Note: RainbowKit uses complex state management, this provides a simplified mock
 */
export async function setupMockWallet(page: Page): Promise<void> {
    await page.addInitScript((walletData) => {
        // Store mock wallet data for test assertions
        (window as unknown as { __mockWallet: typeof walletData }).__mockWallet = walletData;
    }, mockConnectedWallet);
}

/**
 * Collect console and network errors during test execution
 */
export interface ErrorCollector {
    consoleErrors: string[];
    networkErrors: string[];
}

export function setupErrorCollector(page: Page): ErrorCollector {
    const collector: ErrorCollector = {
        consoleErrors: [],
        networkErrors: [],
    };

    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            collector.consoleErrors.push(`[Console] ${msg.text()}`);
        }
    });

    page.on('requestfailed', (request) => {
        collector.networkErrors.push(
            `[Network] ${request.method()} ${request.url()} - ${request.failure()?.errorText}`
        );
    });

    return collector;
}

/**
 * Take a timestamped screenshot
 */
export async function takeScreenshot(
    page: Page,
    name: string,
    directory = 'screenshots'
): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const path = `${directory}/${name}-${timestamp}.png`;
    await page.screenshot({ path, fullPage: true });
}

/**
 * Wait for an element to be visible and stable
 */
export async function waitForElement(
    page: Page,
    selector: string,
    options: { timeout?: number; state?: 'visible' | 'hidden' | 'attached' } = {}
): Promise<boolean> {
    try {
        await page.waitForSelector(selector, {
            timeout: options.timeout ?? 5000,
            state: options.state ?? 'visible',
        });
        return true;
    } catch {
        return false;
    }
}

/**
 * Viewport configurations for responsive testing
 */
export const viewports = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 720 },
    widescreen: { width: 1920, height: 1080 },
};

/**
 * Common test selectors
 */
export const selectors = {
    // Layout
    sidebar: 'aside',
    header: 'header',
    main: 'main',
    navigation: 'nav',

    // Wallet
    connectWalletButton: 'button:has-text("Connect Wallet")',
    walletModal: '[role="dialog"]',
    wrongNetworkButton: 'button:has-text("Wrong Network")',

    // Dashboard
    agentCard: '[data-testid="agent-card"]',
    hireButton: 'button:has-text("Hire")',
    feedbackButton: 'button:has-text("Feedback")',

    // Modals
    dialog: '[role="dialog"]',
    dialogTitle: '[role="dialog"] h2',
    dialogClose: '[role="dialog"] button:has-text("Close"), [role="dialog"] button:has-text("Cancel")',

    // Forms
    taskDescriptionInput: 'textarea[placeholder*="task"]',
    submitButton: 'button[type="submit"]',

    // Mobile
    mobileMenuButton: 'button[aria-label="Open navigation menu"]',
    mobileNavSheet: '[role="dialog"]',

    // Common UI
    skeleton: '.animate-pulse, [data-testid="skeleton"]',
    loadingSpinner: '.animate-spin',
    errorMessage: '.text-destructive, .text-red-400',
};
