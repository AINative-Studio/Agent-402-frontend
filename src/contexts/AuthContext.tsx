import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthState {
  apiKey: string | null;
  isAuthenticated: boolean;
  user: { id: string } | null;
}

interface AuthContextType extends AuthState {
  login: (apiKey: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    apiKey: null,
    isAuthenticated: false,
    user: null,
  });

  // Restore auth from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('apiKey');
    if (savedApiKey) {
      setAuthState({
        apiKey: savedApiKey,
        isAuthenticated: true,
        user: { id: 'user' }, // Will be updated after verify call
      });
    }
  }, []);

  // Listen for logout events from apiClient (on 401 responses)
  useEffect(() => {
    const handleLogout = () => {
      setAuthState({
        apiKey: null,
        isAuthenticated: false,
        user: null,
      });
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = async (apiKey: string) => {
    // Store API key
    localStorage.setItem('apiKey', apiKey);
    setAuthState({
      apiKey,
      isAuthenticated: true,
      user: { id: 'user' },
    });
  };

  const logout = () => {
    localStorage.removeItem('apiKey');
    setAuthState({
      apiKey: null,
      isAuthenticated: false,
      user: null,
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
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
