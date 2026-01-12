import { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import { Toast, ToastType } from '../components/Toast';
import { toastEmitter } from '../lib/apiClient';

interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
    action?: ToastAction;
}

interface ToastAction {
    label: string;
    onClick: () => void;
}

interface ToastContextType {
    showToast: (type: ToastType, message: string, duration?: number, action?: ToastAction) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number, action?: ToastAction) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const MAX_TOASTS = 5;
const DEFAULT_ERROR_DURATION = 7000;
const DEFAULT_SUCCESS_DURATION = 4000;
const DEFAULT_WARNING_DURATION = 6000;
const DEFAULT_INFO_DURATION = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const toastQueue = useRef<ToastMessage[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));

        // Process queue if there are pending toasts
        setTimeout(() => {
            if (toastQueue.current.length > 0) {
                const nextToast = toastQueue.current.shift();
                if (nextToast) {
                    setToasts((prev) => [...prev, nextToast]);
                }
            }
        }, 300);
    }, []);

    const showToast = useCallback((
        type: ToastType,
        message: string,
        duration?: number,
        action?: ToastAction
    ) => {
        const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const newToast: ToastMessage = {
            id,
            type,
            message,
            duration: duration ?? (type === 'error' ? DEFAULT_ERROR_DURATION : DEFAULT_INFO_DURATION),
            action
        };

        setToasts((prev) => {
            // If we're at max capacity, queue the toast
            if (prev.length >= MAX_TOASTS) {
                toastQueue.current.push(newToast);
                return prev;
            }
            return [...prev, newToast];
        });
    }, []);

    const success = useCallback((message: string, duration = DEFAULT_SUCCESS_DURATION) => {
        showToast('success', message, duration);
    }, [showToast]);

    const error = useCallback((message: string, duration = DEFAULT_ERROR_DURATION, action?: ToastAction) => {
        showToast('error', message, duration, action);
    }, [showToast]);

    const warning = useCallback((message: string, duration = DEFAULT_WARNING_DURATION) => {
        showToast('warning', message, duration);
    }, [showToast]);

    const info = useCallback((message: string, duration = DEFAULT_INFO_DURATION) => {
        showToast('info', message, duration);
    }, [showToast]);

    const clearAll = useCallback(() => {
        setToasts([]);
        toastQueue.current = [];
    }, []);

    // Subscribe to API error toast events
    useEffect(() => {
        const unsubscribe = toastEmitter.subscribe((type, message, action) => {
            showToast(type as ToastType, message, undefined, action);
        });

        return unsubscribe;
    }, [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, success, error, warning, info, clearAll }}>
            {children}
            <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-md w-full pointer-events-none">
                <div className="space-y-2 pointer-events-auto">
                    {toasts.map((toast) => (
                        <Toast
                            key={toast.id}
                            id={toast.id}
                            type={toast.type}
                            message={toast.message}
                            duration={toast.duration}
                            onClose={removeToast}
                            action={toast.action}
                        />
                    ))}
                </div>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
