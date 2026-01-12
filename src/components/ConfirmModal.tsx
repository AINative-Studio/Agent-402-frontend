import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    isLoading = false,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: 'text-red-400',
            bg: 'bg-red-500/10',
            border: 'border-red-500/30',
            button: 'bg-red-600 hover:bg-red-700 disabled:bg-red-800',
        },
        warning: {
            icon: 'text-yellow-400',
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/30',
            button: 'bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800',
        },
        info: {
            icon: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/30',
            button: 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800',
        },
    };

    const styles = variantStyles[variant];

    const handleConfirm = () => {
        if (!isLoading) {
            onConfirm();
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--surface)] rounded-xl shadow-2xl max-w-md w-full border border-[var(--border)]">
                <div className="p-6 space-y-4">
                    <div className={`flex items-center gap-3 p-4 rounded-lg border ${styles.bg} ${styles.border}`}>
                        <AlertTriangle className={`w-6 h-6 flex-shrink-0 ${styles.icon}`} />
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-[var(--text)] mb-1">
                                {title}
                            </h3>
                            <p className="text-sm text-[var(--muted)]">
                                {message}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-[var(--muted)] hover:text-[var(--text)] transition-colors disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className={`px-6 py-2 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${styles.button}`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                confirmText
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
