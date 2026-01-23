import { useState, useCallback } from 'react';
import {
    Bell,
    Check,
    CheckCheck,
    Info,
    AlertTriangle,
    AlertCircle,
    X,
    Trash2,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

/**
 * Notification types for different events
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'transaction';

/**
 * Single notification item
 */
export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    action?: {
        label: string;
        onClick: () => void;
    };
    metadata?: Record<string, unknown>;
}

/**
 * Hook return type
 */
interface UseNotificationsReturn {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => string;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    removeNotification: (id: string) => void;
    clearAll: () => void;
}

/**
 * Custom hook for notification management
 */
export function useNotifications(): UseNotificationsReturn {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const addNotification = useCallback(
        (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
            const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const newNotification: Notification = {
                ...notification,
                id,
                timestamp: new Date(),
                read: false,
            };

            setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep max 50 notifications
            return id;
        },
        []
    );

    const markAsRead = useCallback((id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    return {
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
    };
}

/**
 * Props for NotificationCenter component
 */
interface NotificationCenterProps {
    notifications: Notification[];
    unreadCount: number;
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onRemove: (id: string) => void;
    onClearAll: () => void;
    className?: string;
}

/**
 * Get icon for notification type
 */
function getNotificationIcon(type: NotificationType) {
    switch (type) {
        case 'success':
            return <Check className="h-4 w-4 text-green-500" />;
        case 'error':
            return <AlertCircle className="h-4 w-4 text-destructive" />;
        case 'warning':
            return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
        case 'transaction':
            return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
        case 'info':
        default:
            return <Info className="h-4 w-4 text-blue-500" />;
    }
}

/**
 * Format relative time
 */
function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;

    return date.toLocaleDateString();
}

/**
 * Single notification item component
 */
function NotificationItem({
    notification,
    onMarkAsRead,
    onRemove,
}: {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
    onRemove: (id: string) => void;
}) {
    return (
        <div
            className={cn(
                'group relative flex gap-3 p-4 border-b border-border transition-colors',
                !notification.read && 'bg-primary/5',
                'hover:bg-muted/50'
            )}
        >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <h4 className={cn('text-sm font-medium', !notification.read && 'text-foreground')}>
                        {notification.title}
                    </h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(notification.timestamp)}
                    </span>
                </div>

                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {notification.message}
                </p>

                {/* Action Button */}
                {notification.action && (
                    <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto mt-2 text-primary"
                        onClick={() => {
                            notification.action?.onClick();
                            onMarkAsRead(notification.id);
                        }}
                    >
                        {notification.action.label}
                    </Button>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!notification.read && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onMarkAsRead(notification.id)}
                        title="Mark as read"
                    >
                        <Check className="h-3 w-3" />
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemove(notification.id)}
                    title="Remove"
                >
                    <X className="h-3 w-3" />
                </Button>
            </div>

            {/* Unread indicator */}
            {!notification.read && (
                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
            )}
        </div>
    );
}

/**
 * NotificationCenter - Notification management panel
 *
 * Features:
 * - Sheet-based notification panel
 * - Unread count badge
 * - Mark as read / mark all as read
 * - Remove individual notifications
 * - Clear all notifications
 * - Transaction confirmations
 * - Agent status updates
 */
export function NotificationCenter({
    notifications,
    unreadCount,
    onMarkAsRead,
    onMarkAllAsRead,
    onRemove,
    onClearAll,
    className,
}: NotificationCenterProps) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn('relative', className)}
                    aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>

            <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
                <SheetHeader className="p-4 border-b border-border">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Notifications
                            {unreadCount > 0 && (
                                <Badge variant="secondary" className="ml-1">
                                    {unreadCount} new
                                </Badge>
                            )}
                        </SheetTitle>

                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onMarkAllAsRead}
                                    className="text-xs"
                                >
                                    <CheckCheck className="h-4 w-4 mr-1" />
                                    Mark all read
                                </Button>
                            )}
                            {notifications.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={onClearAll}
                                    title="Clear all"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                    <SheetDescription className="sr-only">
                        View and manage your notifications
                    </SheetDescription>
                </SheetHeader>

                {/* Notification List */}
                <div className="flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-medium mb-1">No notifications</h3>
                            <p className="text-sm text-muted-foreground">
                                You're all caught up! Check back later for updates.
                            </p>
                        </div>
                    ) : (
                        <div>
                            {notifications.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onMarkAsRead={onMarkAsRead}
                                    onRemove={onRemove}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

/**
 * Context provider for global notification state
 */
import { createContext, useContext, ReactNode } from 'react';

const NotificationContext = createContext<UseNotificationsReturn | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const notifications = useNotifications();

    return (
        <NotificationContext.Provider value={notifications}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotificationContext() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotificationContext must be used within NotificationProvider');
    }
    return context;
}
