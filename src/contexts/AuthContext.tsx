import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
    login as authLogin,
    logout as authLogout,
    register as authRegister,
    getCurrentUser,
    getStoredToken,
    getStoredUser,
    clearAuthData,
    type LoginRequest,
    type RegisterRequest,
    type UserInfo,
    type TokenResponse,
    AuthError,
} from '../lib/authService';

interface AuthState {
    token: string | null;
    isAuthenticated: boolean;
    user: UserInfo | null;
    isLoading: boolean;
}

interface AuthContextType extends AuthState {
    login: (credentials: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authState, setAuthState] = useState<AuthState>({
        token: null,
        isAuthenticated: false,
        user: null,
        isLoading: true,
    });

    // Initialize auth state from localStorage
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = getStoredToken();
            const storedUser = getStoredUser();

            if (storedToken && storedUser) {
                // Validate token by fetching current user
                try {
                    const user = await getCurrentUser(storedToken);
                    setAuthState({
                        token: storedToken,
                        isAuthenticated: true,
                        user,
                        isLoading: false,
                    });
                } catch (error) {
                    // Token invalid or expired
                    console.error('Session validation failed:', error);
                    clearAuthData();
                    setAuthState({
                        token: null,
                        isAuthenticated: false,
                        user: null,
                        isLoading: false,
                    });
                }
            } else {
                setAuthState(prev => ({ ...prev, isLoading: false }));
            }
        };

        initAuth();
    }, []);

    // Listen for logout events from apiClient (on 401 responses)
    useEffect(() => {
        const handleLogout = () => {
            clearAuthData();
            setAuthState({
                token: null,
                isAuthenticated: false,
                user: null,
                isLoading: false,
            });
        };

        window.addEventListener('auth:logout', handleLogout);
        return () => window.removeEventListener('auth:logout', handleLogout);
    }, []);

    const login = useCallback(async (credentials: LoginRequest) => {
        const { token, user } = await authLogin(credentials);
        setAuthState({
            token: token.access_token,
            isAuthenticated: true,
            user,
            isLoading: false,
        });
    }, []);

    const register = useCallback(async (data: RegisterRequest) => {
        // Register the user
        await authRegister(data);
        // Auto-login after registration
        await login({ email: data.email, password: data.password });
    }, [login]);

    const logout = useCallback(async () => {
        await authLogout();
        setAuthState({
            token: null,
            isAuthenticated: false,
            user: null,
            isLoading: false,
        });
    }, []);

    const refreshUser = useCallback(async () => {
        if (!authState.token) return;

        try {
            const user = await getCurrentUser(authState.token);
            setAuthState(prev => ({ ...prev, user }));
        } catch (error) {
            if (error instanceof AuthError && error.status === 401) {
                await logout();
            }
        }
    }, [authState.token, logout]);

    return (
        <AuthContext.Provider
            value={{
                ...authState,
                login,
                register,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within AuthProvider');
    }
    return context;
}

// Re-export types for convenience
export type { LoginRequest, RegisterRequest, UserInfo, TokenResponse };
export { AuthError };
