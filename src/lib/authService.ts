/**
 * AINative Authentication Service
 *
 * Handles authentication using AINative's public auth endpoints.
 * Uses JWT tokens stored in localStorage for session management.
 */

import axios from 'axios';

// AINative Auth API base URL
const AUTH_API_BASE = 'https://api.ainative.studio/v1/public/auth';

// Token storage key
const TOKEN_KEY = 'agent402_access_token';
const USER_KEY = 'agent402_user';

/**
 * Login request payload
 */
export interface LoginRequest {
    email?: string;
    username?: string;
    password: string;
}

/**
 * Registration request payload
 */
export interface RegisterRequest {
    email: string;
    password: string;
    full_name?: string;
    username?: string;
}

/**
 * Token response from auth endpoints
 */
export interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

/**
 * User info response
 */
export interface UserInfo {
    id: string;
    email: string;
    is_active: boolean;
    role: string;
    full_name: string | null;
    username: string | null;
    email_verified: boolean;
    created_at: string;
}

/**
 * Auth service error
 */
export class AuthError extends Error {
    status: number;
    code?: string;

    constructor(message: string, status: number, code?: string) {
        super(message);
        this.name = 'AuthError';
        this.status = status;
        this.code = code;
    }
}

/**
 * Login with email/username and password
 */
export async function login(credentials: LoginRequest): Promise<{ token: TokenResponse; user: UserInfo }> {
    try {
        // Login to get token
        const tokenResponse = await axios.post<TokenResponse>(
            `${AUTH_API_BASE}/login-json`,
            credentials
        );

        const token = tokenResponse.data;

        // Store token
        localStorage.setItem(TOKEN_KEY, token.access_token);

        // Fetch user info with the new token
        const user = await getCurrentUser(token.access_token);

        // Store user
        localStorage.setItem(USER_KEY, JSON.stringify(user));

        return { token, user };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const message = error.response?.data?.detail || 'Login failed';
            const status = error.response?.status || 500;
            throw new AuthError(message, status);
        }
        throw error;
    }
}

/**
 * Register a new user
 */
export async function register(data: RegisterRequest): Promise<UserInfo> {
    try {
        const response = await axios.post<UserInfo>(
            `${AUTH_API_BASE}/register`,
            data
        );
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const message = error.response?.data?.detail || 'Registration failed';
            const status = error.response?.status || 500;
            throw new AuthError(message, status);
        }
        throw error;
    }
}

/**
 * Get current user info
 */
export async function getCurrentUser(token?: string): Promise<UserInfo> {
    const accessToken = token || getStoredToken();

    if (!accessToken) {
        throw new AuthError('No access token', 401);
    }

    try {
        const response = await axios.get<UserInfo>(
            `${AUTH_API_BASE}/me`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const message = error.response?.data?.detail || 'Failed to get user info';
            const status = error.response?.status || 500;
            throw new AuthError(message, status);
        }
        throw error;
    }
}

/**
 * Refresh the access token
 */
export async function refreshToken(): Promise<TokenResponse> {
    const currentToken = getStoredToken();

    if (!currentToken) {
        throw new AuthError('No access token to refresh', 401);
    }

    try {
        const response = await axios.post<TokenResponse>(
            `${AUTH_API_BASE}/refresh`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${currentToken}`,
                },
            }
        );

        const token = response.data;

        // Store new token
        localStorage.setItem(TOKEN_KEY, token.access_token);

        return token;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const message = error.response?.data?.detail || 'Token refresh failed';
            const status = error.response?.status || 500;
            throw new AuthError(message, status);
        }
        throw error;
    }
}

/**
 * Logout the current user
 */
export async function logout(): Promise<void> {
    const token = getStoredToken();

    if (token) {
        try {
            await axios.post(
                `${AUTH_API_BASE}/logout`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
        } catch {
            // Ignore logout API errors - we'll clear local state anyway
        }
    }

    // Clear stored auth data
    clearAuthData();
}

/**
 * Get stored access token
 */
export function getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get stored user info
 */
export function getStoredUser(): UserInfo | null {
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;

    try {
        return JSON.parse(userJson);
    } catch {
        return null;
    }
}

/**
 * Clear all auth data from storage
 */
export function clearAuthData(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Also clear legacy API key if present
    localStorage.removeItem('apiKey');
}

/**
 * Check if user is authenticated (has valid token)
 */
export function isAuthenticated(): boolean {
    return !!getStoredToken();
}
