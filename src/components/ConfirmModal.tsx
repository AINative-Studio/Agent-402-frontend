import { AlertTriangle, Loader2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogAction,
    AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

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
    const variantStyles = {
        danger: {
            alert: 'border-destructive/30 bg-destructive/10',
            icon: 'text-destructive',
            button: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        },
        warning: {
            alert: 'border-warning/30 bg-warning/10',
            icon: 'text-warning',
            button: 'bg-warning text-warning-foreground hover:bg-warning/90',
        },
        info: {
            alert: 'border-info/30 bg-info/10',
            icon: 'text-info',
            button: 'bg-info text-info-foreground hover:bg-info/90',
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
        <AlertDialog open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()}>
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                    <Alert className={cn('flex items-start gap-3', styles.alert)}>
                        <AlertTriangle className={cn('h-5 w-5 flex-shrink-0', styles.icon)} />
                        <div className="flex-1">
                            <AlertDialogTitle className="mb-1">{title}</AlertDialogTitle>
                            <AlertDescription className="text-muted-foreground">
                                {message}
                            </AlertDescription>
                        </div>
                    </Alert>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={cn(styles.button, 'gap-2')}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            confirmText
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
