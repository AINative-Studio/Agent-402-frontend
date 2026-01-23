import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotifications } from './NotificationCenter';

describe('useNotifications hook', () => {
    it('should initialize with empty notifications', () => {
        const { result } = renderHook(() => useNotifications());

        expect(result.current.notifications).toHaveLength(0);
        expect(result.current.unreadCount).toBe(0);
    });

    it('should add a notification', () => {
        const { result } = renderHook(() => useNotifications());

        act(() => {
            result.current.addNotification({
                type: 'info',
                title: 'Test Notification',
                message: 'This is a test message',
            });
        });

        expect(result.current.notifications).toHaveLength(1);
        expect(result.current.notifications[0].title).toBe('Test Notification');
        expect(result.current.unreadCount).toBe(1);
    });

    it('should mark notification as read', () => {
        const { result } = renderHook(() => useNotifications());

        let notificationId: string;

        act(() => {
            notificationId = result.current.addNotification({
                type: 'success',
                title: 'Success',
                message: 'Operation completed',
            });
        });

        expect(result.current.unreadCount).toBe(1);

        act(() => {
            result.current.markAsRead(notificationId);
        });

        expect(result.current.unreadCount).toBe(0);
        expect(result.current.notifications[0].read).toBe(true);
    });

    it('should mark all notifications as read', () => {
        const { result } = renderHook(() => useNotifications());

        act(() => {
            result.current.addNotification({
                type: 'info',
                title: 'Notification 1',
                message: 'Message 1',
            });
            result.current.addNotification({
                type: 'warning',
                title: 'Notification 2',
                message: 'Message 2',
            });
        });

        expect(result.current.unreadCount).toBe(2);

        act(() => {
            result.current.markAllAsRead();
        });

        expect(result.current.unreadCount).toBe(0);
    });

    it('should remove a notification', () => {
        const { result } = renderHook(() => useNotifications());

        let notificationId: string;

        act(() => {
            notificationId = result.current.addNotification({
                type: 'error',
                title: 'Error',
                message: 'Something went wrong',
            });
        });

        expect(result.current.notifications).toHaveLength(1);

        act(() => {
            result.current.removeNotification(notificationId);
        });

        expect(result.current.notifications).toHaveLength(0);
    });

    it('should clear all notifications', () => {
        const { result } = renderHook(() => useNotifications());

        act(() => {
            result.current.addNotification({
                type: 'info',
                title: 'Notification 1',
                message: 'Message 1',
            });
            result.current.addNotification({
                type: 'success',
                title: 'Notification 2',
                message: 'Message 2',
            });
            result.current.addNotification({
                type: 'warning',
                title: 'Notification 3',
                message: 'Message 3',
            });
        });

        expect(result.current.notifications).toHaveLength(3);

        act(() => {
            result.current.clearAll();
        });

        expect(result.current.notifications).toHaveLength(0);
    });

    it('should limit notifications to 50', () => {
        const { result } = renderHook(() => useNotifications());

        act(() => {
            for (let i = 0; i < 60; i++) {
                result.current.addNotification({
                    type: 'info',
                    title: `Notification ${i}`,
                    message: `Message ${i}`,
                });
            }
        });

        expect(result.current.notifications.length).toBeLessThanOrEqual(50);
    });

    it('should add notification with action', () => {
        const { result } = renderHook(() => useNotifications());
        const onActionClick = vi.fn();

        act(() => {
            result.current.addNotification({
                type: 'transaction',
                title: 'Transaction Pending',
                message: 'View on explorer',
                action: {
                    label: 'View',
                    onClick: onActionClick,
                },
            });
        });

        expect(result.current.notifications[0].action).toBeDefined();
        expect(result.current.notifications[0].action?.label).toBe('View');
    });
});
