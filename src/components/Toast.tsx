import { useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastAction {
    label: string;
    onClick: () => void;
}

interface ToastProps {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
    onClose: (id: string) => void;
    action?: ToastAction;
}

export function Toast({ id, type, message, duration = 5000, onClose, action }: ToastProps) {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose(id);
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [id, duration, onClose]);

    const icons = {
        success: <CheckCircle className="w-5 h-5" />,
        error: <XCircle className="w-5 h-5" />,
        warning: <AlertCircle className="w-5 h-5" />,
        info: <Info className="w-5 h-5" />,
    };

    const styles = {
        success: 'bg-green-500/10 border-green-500/30 text-green-300',
        error: 'bg-red-500/10 border-red-500/30 text-red-300',
        warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
        info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    };

    const handleAction = () => {
        if (action) {
            action.onClick();
            onClose(id);
        }
    };

    return (
        <div
            className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-slide-in-right ${styles[type]}`}
            role="alert"
            aria-live={type === 'error' ? 'assertive' : 'polite'}
        >
            <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium break-words">{message}</p>
                {action && (
                    <button
                        onClick={handleAction}
                        className="mt-2 text-xs font-semibold underline hover:no-underline transition-all"
                        aria-label={action.label}
                    >
                        {action.label}
                    </button>
                )}
            </div>
            <button
                onClick={() => onClose(id)}
                className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
                aria-label="Close notification"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
