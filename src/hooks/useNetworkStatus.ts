import { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';

export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [wasOffline, setWasOffline] = useState(false);
    const toast = useToast();

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            if (wasOffline) {
                toast.success('Connection restored');
                setWasOffline(false);
            }
        };

        const handleOffline = () => {
            setIsOnline(false);
            setWasOffline(true);
            toast.warning('No internet connection', 0); // 0 = don't auto-dismiss
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check
        if (!navigator.onLine) {
            handleOffline();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [wasOffline, toast]);

    return { isOnline, wasOffline };
}
